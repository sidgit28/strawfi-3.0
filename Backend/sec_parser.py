#!/usr/bin/env python3
import sec_edgar_downloader
from bs4 import BeautifulSoup
import re
import json
import os
import glob
from nltk.tokenize import sent_tokenize
import logging
import nltk
import sys

# Ensure NLTK punkt is downloaded
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# List of large-cap stocks that typically have complex filings
LARGE_CAP_TICKERS = [
    'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'GOOG', 'META', 'TSLA', 'BRK.A', 'BRK.B', 
    'JPM', 'V', 'PG', 'UNH', 'HD', 'MA', 'BAC', 'XOM', 'DIS', 'NVDA', 'PYPL',
    'ADBE', 'INTC', 'CMCSA', 'PFE', 'WMT', 'CRM', 'NFLX', 'VZ', 'ABT', 'KO'
]

def fetch_sec_filing(ticker, form_type, year):
    download_dir = "sec-edgar"
    os.makedirs(download_dir, exist_ok=True)
    dl = sec_edgar_downloader.Downloader("FinTech-App", "noreply@fintechapp.example.com", download_dir)
    try:
        after_date = f"{int(year) - 1}-07-01"
        before_date = f"{int(year) + 1}-12-31"
        dl.get(form_type, ticker, limit=1, after=after_date, before=before_date)
        path = os.path.join(download_dir, "sec-edgar-filings", ticker, form_type, "*", "full-submission.txt")
        txt_files = glob.glob(path)
        if not txt_files:
            logger.error("No filing found for %s %s %s", ticker, form_type, year)
            return None, None
        txt_file = max(txt_files, key=os.path.getctime)
        with open(txt_file, 'r', encoding='utf-8', errors='ignore') as f:
            full_content = f.read()
        
        # Check if this is a large-cap stock that might need special handling
        is_large_cap = ticker.upper() in LARGE_CAP_TICKERS
        
        # Special handling for TSLA which often has XBRL-heavy filings
        if ticker.upper() == 'TSLA':
            logger.info("Special handling for TSLA filing")
            return handle_special_filing(full_content, form_type, ticker)
        
        # Enhanced handling for large-cap stocks with complex filings
        elif is_large_cap:
            logger.info("Enhanced handling for large-cap stock: %s", ticker.upper())
            return handle_large_cap_filing(full_content, form_type, ticker)
            
        # Standard processing for regular filings
        html_start = full_content.find("<HTML>")
        html_end = full_content.rfind("</HTML>") + len("</HTML>")
        if html_start != -1 and html_end > html_start:
            logger.info("Extracted HTML content from %s", txt_file)
            return full_content[html_start:html_end], full_content
        documents = re.findall(r"<DOCUMENT>(.*?)</DOCUMENT>", full_content, re.DOTALL | re.IGNORECASE)
        for doc in documents:
            if f"<TYPE>{form_type}" in doc:
                text_match = re.search(r"<TEXT>(.*?)</TEXT>", doc, re.DOTALL | re.IGNORECASE)
                if text_match:
                    logger.info("Extracted TEXT section for %s", form_type)
                    return text_match.group(1), full_content
        logger.error("No valid HTML or TEXT section found in %s", txt_file)
        return None, None
    except Exception as e:
        logger.error("Error fetching filing for %s %s %s: %s", ticker, form_type, year, str(e))
        return None, None

def handle_special_filing(full_content, form_type, ticker):
    """Special handler for Tesla filings which often have complex XBRL formatting"""
    logger.info("Processing %s filing with special handler", ticker)
    
    # For TSLA specifically, first try to find the document with exactly this form type
    if ticker.upper() == 'TSLA':
        documents = re.findall(r"<DOCUMENT>(.*?)</DOCUMENT>", full_content, re.DOTALL | re.IGNORECASE)
        for doc in documents:
            type_match = re.search(r"<TYPE>(.*?)</TYPE>", doc, re.DOTALL | re.IGNORECASE)
            if type_match and type_match.group(1).strip() == form_type:
                text_match = re.search(r"<TEXT>(.*?)</TEXT>", doc, re.DOTALL | re.IGNORECASE)
                if text_match:
                    content = text_match.group(1)
                    logger.info("Found exact %s document for TSLA", form_type)
                    return content, full_content
        
        # If form not found directly, try specific sections for form 10-K
        if form_type == '10-K':
            # For 10-K, look for common sections that must be present
            for doc in documents:
                doc_content = doc.lower()
                # Look for key 10-K sections that must be included
                if ('item 1' in doc_content and 'item 1a' in doc_content and 
                    'risk factors' in doc_content and 'management\'s discussion' in doc_content):
                    text_match = re.search(r"<TEXT>(.*?)</TEXT>", doc, re.DOTALL | re.IGNORECASE)
                    if text_match:
                        content = text_match.group(1)
                        logger.info("Found likely 10-K content for TSLA based on section markers")
                        return content, full_content
    
    # First try to find the HTML section
    html_start = full_content.find("<HTML>")
    html_end = full_content.rfind("</HTML>") + len("</HTML>")
    
    if html_start != -1 and html_end > html_start:
        html_content = full_content[html_start:html_end]
        
        # XBRL tags often found in TSLA and other complex filings
        # Replace all ix:* tags with simple div tags to make parsing easier
        html_content = re.sub(r'<ix:[^>]*>', '<div>', html_content)
        html_content = re.sub(r'</ix:[^>]*>', '</div>', html_content)
        
        return html_content, full_content
    
    # Try to extract from documents
    documents = re.findall(r"<DOCUMENT>(.*?)</DOCUMENT>", full_content, re.DOTALL | re.IGNORECASE)
    
    # Look for the form
    for doc in documents:
        if f"<TYPE>{form_type}" in doc:
            text_match = re.search(r"<TEXT>(.*?)</TEXT>", doc, re.DOTALL | re.IGNORECASE)
            if text_match:
                return text_match.group(1), full_content
    
    # If we can't find the right document, try looking for HTML in any document
    for doc in documents:
        if "<HTML>" in doc:
            html_start = doc.find("<HTML>")
            html_end = doc.rfind("</HTML>") + len("</HTML>")
            if html_start != -1 and html_end > html_start:
                return doc[html_start:html_end], full_content
    
    # Last resort - just return the full content
    logger.warning("Could not find proper HTML/TEXT section for %s, using full content", ticker)
    return full_content, full_content

def handle_large_cap_filing(full_content, form_type, ticker):
    """Enhanced handler for large-cap stocks with complex filings"""
    logger.info("Processing %s filing with large-cap handler", ticker)
    
    # First try standard HTML extraction
    html_start = full_content.find("<HTML>")
    html_end = full_content.rfind("</HTML>") + len("</HTML>")
    
    if html_start != -1 and html_end > html_start:
        html_content = full_content[html_start:html_end]
        
        # Some large-caps use XBRL tags, handle them more gracefully
        if "<ix:" in html_content:
            logger.info("Found XBRL tags in %s, preprocessing content", ticker)
            html_content = re.sub(r'<ix:[^>]*>', '<div>', html_content)
            html_content = re.sub(r'</ix:[^>]*>', '</div>', html_content)
        
        return html_content, full_content
    
    # If no HTML found, try document extraction
    documents = re.findall(r"<DOCUMENT>(.*?)</DOCUMENT>", full_content, re.DOTALL | re.IGNORECASE)
    
    # First look for the specific form type
    for doc in documents:
        if f"<TYPE>{form_type}" in doc:
            text_match = re.search(r"<TEXT>(.*?)</TEXT>", doc, re.DOTALL | re.IGNORECASE)
            if text_match:
                content = text_match.group(1)
                if "<HTML>" in content:
                    # Extract just the HTML portion if available
                    html_start = content.find("<HTML>")
                    html_end = content.rfind("</HTML>") + len("</HTML>")
                    if html_end > html_start:
                        return content[html_start:html_end], full_content
                return content, full_content
    
    # If form not found, look for any HTML content in other documents
    for doc in documents:
        if "<HTML>" in doc:
            html_start = doc.find("<HTML>")
            html_end = doc.rfind("</HTML>") + len("</HTML>")
            if html_start != -1 and html_end > html_start:
                return doc[html_start:html_end], full_content
    
    # Fallback to the full content as a last resort
    logger.warning("Could not extract specific content for %s, using full submission", ticker)
    return full_content, full_content

def clean_text(text):
    if not text:
        return ""
    text = re.sub(r'<ix:.*?>.*?</ix:.*?>', '', text, flags=re.DOTALL)
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'^\s*\d+\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*\*+\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'\s+', ' ', text).strip()
    return text if text else ""

def chunk_text(text, max_tokens=500, overlap=1):
    if not text or len(text.strip()) < 10:
        logger.warning("Empty or too short text for chunking: %s", text[:50])
        return []
    try:
        sentences = sent_tokenize(text)
        if not sentences:
            logger.warning("No sentences tokenized, falling back to simple split: %s", text[:50])
            sentences = text.split('. ')
            sentences = [s + '.' for s in sentences if s]
        chunks = []
        current_chunk = []
        current_tokens = 0
        for sentence in sentences:
            token_count = len(sentence.split())
            if current_tokens + token_count > max_tokens:
                if current_chunk:
                    chunks.append(" ".join(current_chunk))
                    current_chunk = current_chunk[-overlap:] if overlap > 0 else []
                    current_tokens = sum(len(s.split()) for s in current_chunk)
            current_chunk.append(sentence)
            current_tokens += token_count
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        logger.info("Chunked text into %d chunks, first chunk: %s", len(chunks), chunks[0][:50] if chunks else "None")
        return chunks
    except Exception as e:
        logger.error("Error chunking text: %s, input: %s", str(e), text[:50])
        return [text] if text.strip() else []

def parse_sections(html_content, full_content, form_type, ticker):
    try:
        soup = BeautifulSoup(html_content, 'lxml')
        metadata = {
            "cik": "Not Found",
            "company": "Not Found",
            "ticker": ticker,
            "form": form_type
        }

        # Helper function to clean XBRL tags
        def clean_xbrl(text):
            return re.sub(r'<ix:.*?>|</ix:.*?>', '', text, flags=re.DOTALL)

        # Extract metadata from SEC-HEADER using full_content
        sec_header = re.search(r'<SEC-HEADER>(.*?)</SEC-HEADER>', full_content, re.DOTALL | re.IGNORECASE)
        header_text = ""
        if sec_header:
            header_text = clean_xbrl(sec_header.group(1))
            logger.info("SEC-HEADER found: %s", header_text[:200])
            cik_match = re.search(r'(?:CENTRAL INDEX KEY|CIK|CIK Number):\s*0*(\d{1,10})', header_text, re.I)
            if cik_match:
                metadata["cik"] = cik_match.group(1).zfill(10)
                logger.info("CIK found in SEC-HEADER: %s", metadata["cik"])
            else:
                logger.warning("CIK not found in SEC-HEADER: %s", header_text[:200])
            company_match = re.search(r'(?:COMPANY CONFORMED NAME|COMPANY NAME):\s*(.*?)(?:\n|$)', header_text, re.I)
            if company_match:
                company_name = clean_text(company_match.group(1).strip())
                if not re.match(r'.*-\d{8}$', company_name) and len(company_name) > 3:
                    metadata["company"] = company_name
                    logger.info("Company name found in SEC-HEADER: %s", company_name)
                else:
                    logger.warning("Invalid company name in SEC-HEADER: %s", company_name)
        else:
            logger.warning("No SEC-HEADER found in filing: %s", full_content[:200])

        # Fallback searches for CIK
        if metadata["cik"] == "Not Found":
            # Search cover page
            cover_page = soup.find(string=re.compile(r'Cover Page|Form 10-K Summary|Exact name of registrant', re.I))
            if cover_page:
                parent = cover_page.find_parent(['div', 'p', 'table', 'section'])
                if parent:
                    cik_search = parent.find(string=re.compile(r'\b0*\d{1,10}\b', re.I))
                    if cik_search and re.match(r'0*\d{1,10}', cik_search.strip()):
                        metadata["cik"] = cik_search.strip().zfill(10)
                        logger.info("CIK found in cover page: %s", metadata["cik"])
            # Search XBRL tags
            if metadata["cik"] == "Not Found":
                xbrl_cik = soup.find(['ix:nonNumeric', 'ix:nonFraction'], string=re.compile(r'\b0*\d{1,10}\b'))
                if xbrl_cik and re.match(r'0*\d{1,10}', xbrl_cik.text.strip()):
                    metadata["cik"] = xbrl_cik.text.strip().zfill(10)
                    logger.info("CIK found in XBRL tag: %s", metadata["cik"])
            # Search body
            if metadata["cik"] == "Not Found":
                cik_search = soup.find(string=re.compile(r'\b0*\d{1,10}\b', re.I))
                if cik_search and re.match(r'0*\d{1,10}', cik_search.strip()):
                    metadata["cik"] = cik_search.strip().zfill(10)
                    logger.info("CIK found in document body: %s", metadata["cik"])
            if metadata["cik"] == "Not Found":
                logger.error("Failed to extract CIK; sample cover page: %s", cover_page.text[:200] if cover_page else "None")

        # Fallback searches for company
        if metadata["company"] == "Not Found":
            company_patterns = [
                r'Exact name of registrant as specified in its charter.*?\s*(.*?)(?:\n|$|<)',
                r'Name of Registrant.*?:\s*(.*?)(?:\n|$|<)',
                r'Company Name.*?:\s*(.*?)(?:\n|$|<)',
                r'(?:Registrant|Company):\s*(.*?)(?:\n|$|<)'
            ]
            cover_page = soup.find(string=re.compile(r'Cover Page|Form 10-K Summary|Exact name of registrant', re.I))
            if cover_page:
                parent = cover_page.find_parent(['div', 'p', 'table', 'section'])
                if parent:
                    for pattern in company_patterns:
                        company_tag = parent.find(string=re.compile(pattern, re.I))
                        if company_tag:
                            company_match = re.search(pattern, clean_xbrl(company_tag), re.I)
                            if company_match:
                                company_name = clean_text(company_match.group(1).strip())
                                if not re.match(r'.*-\d{8}$', company_name) and len(company_name) > 3:
                                    metadata["company"] = company_name
                                    logger.info("Company name found in cover page with pattern %s: %s", pattern, company_name)
                                    break
            # Search XBRL tags
            if metadata["company"] == "Not Found":
                xbrl_company = soup.find(['ix:nonNumeric', 'ix:nonFraction'], string=re.compile(r'[A-Za-z][A-Za-z\s,]+(?:Inc\.|Corp\.|Ltd\.|LLC)?', re.I))
                if xbrl_company and len(xbrl_company.text.strip()) > 3:
                    company_name = clean_text(xbrl_company.text.strip())
                    if not re.match(r'.*-\d{8}$', company_name):
                        metadata["company"] = company_name
                        logger.info("Company name found in XBRL tag: %s", company_name)
            # Search title or first paragraph
            if metadata["company"] == "Not Found":
                title_tag = soup.find('title') or soup.find(string=re.compile(r'\b(?:Company|Registrant)\b', re.I))
                if title_tag:
                    company_name = clean_text(title_tag.text).split('Form')[0].strip()
                    if not re.match(r'.*-\d{8}$', company_name) and len(company_name) > 3:
                        metadata["company"] = company_name
                        logger.info("Company name found in title: %s", company_name)
                if metadata["company"] == "Not Found":
                    first_p = soup.find('p')
                    if first_p and len(first_p.get_text(strip=True)) > 3:
                        company_name = clean_text(first_p.get_text()).split('Form')[0].strip()
                        if not re.match(r'.*-\d{8}$', company_name) and len(company_name) > 3:
                            metadata["company"] = company_name
                            logger.info("Company name found in first paragraph: %s", company_name)
            if metadata["company"] == "Not Found":
                logger.error("Failed to extract company name; sample cover page: %s", cover_page.text[:200] if cover_page else "None")

        # Parse table of contents - Expanded to handle more formats, especially for TSLA
        toc_sections = []
        
        # Try different TOC detection methods
        # Method 1: Look for Table of Contents text
        toc_candidates = soup.find_all(string=re.compile(r'Table of Contents', re.I))
        
        # Method 2: Look for headers that might contain TOC
        if not toc_candidates:
            toc_candidates = soup.find_all(['h1', 'h2', 'h3', 'h4', 'div', 'p', 'td'], 
                                          string=re.compile(r'^\s*(?:TABLE OF CONTENTS|INDEX TO|INDEX|CONTENTS|Form 10-K)\s*$', re.I))
        
        # Method 3: Check for Item 1, Item 1A patterns directly
        item_pattern = re.compile(r'^\s*ITEM\s+(\d+[A-Za-z]?)[.\s]+(.+)$', re.I)
        item_elements = soup.find_all(string=item_pattern)
        
        if not toc_sections and item_elements:
            logger.info("Found %d item elements directly", len(item_elements))
            for element in item_elements:
                match = item_pattern.match(element.strip())
                if match:
                    item_key = f"item_{match.group(1).lower()}"
                    title = clean_text(match.group(2).strip())
                    if title and len(title) < 100:
                        toc_sections.append({
                            "item": item_key,
                            "title": title
                        })
                        logger.info("Direct TOC item found: %s - %s", item_key, title)
        
        # Process the TOC candidates
        for toc in toc_candidates:
            toc_container = toc.find_parent(['div', 'p', 'table', 'section', 'ul', 'ol', 'td', 'tr'])
            if toc_container:
                # Look in the container and next siblings
                elements_to_check = []
                elements_to_check.extend(toc_container.find_all(['p', 'a', 'tr', 'li', 'div', 'td'], recursive=True))
                
                # Check next 10 siblings for TOC items
                sibling = toc_container.find_next_sibling()
                sibling_count = 0
                while sibling and sibling_count < 10:
                    elements_to_check.extend(sibling.find_all(['p', 'a', 'tr', 'li', 'div', 'td']))
                    sibling = sibling.find_next_sibling()
                    sibling_count += 1
                
                for element in elements_to_check:
                    text = element.get_text(strip=True)
                    if not text:
                        continue
                    match = re.search(r'(?:ITEM|Item)\s+(\d+[A-Za-z]?)[.\s]*\s*([^0-9]+)(?:\d|$)', text, re.I)
                    if match:
                        item_key = f"item_{match.group(1).lower()}"
                        title = clean_text(match.group(2).strip())
                        if title and len(title) < 100:
                            toc_sections.append({
                                "item": item_key,
                                "title": title
                            })
                            logger.info("TOC item found: %s - %s", item_key, title)
        
        # If we still haven't found TOC, try more aggressive pattern matching
        if not toc_sections:
            # Find all paragraphs that look like they might be TOC items
            potential_toc_items = soup.find_all(string=re.compile(r'ITEM\s+\d+[A-Za-z]?', re.I))
            for item in potential_toc_items:
                match = re.search(r'ITEM\s+(\d+[A-Za-z]?)[.\s]*\s*([^0-9]+)(?:\d|$)', item, re.I)
                if match:
                    item_key = f"item_{match.group(1).lower()}"
                    title = clean_text(match.group(2).strip())
                    if title and len(title) < 100:
                        existing = next((section for section in toc_sections if section["item"] == item_key), None)
                        if not existing:
                            toc_sections.append({
                                "item": item_key,
                                "title": title
                            })
                            logger.info("Fallback TOC item found: %s - %s", item_key, title)
        
        # If still no TOC, generate a basic one for TESLA and other companies
        if not toc_sections and ticker.upper() in LARGE_CAP_TICKERS:
            logger.warning("No TOC found for %s, generating generic 10-K structure", ticker)
            generic_toc = [
                {"item": "item_1", "title": "Business"},
                {"item": "item_1a", "title": "Risk Factors"},
                {"item": "item_1b", "title": "Unresolved Staff Comments"},
                {"item": "item_2", "title": "Properties"},
                {"item": "item_3", "title": "Legal Proceedings"},
                {"item": "item_4", "title": "Mine Safety Disclosures"},
                {"item": "item_5", "title": "Market for Registrant's Common Equity"},
                {"item": "item_6", "title": "Selected Financial Data"},
                {"item": "item_7", "title": "Management's Discussion and Analysis"},
                {"item": "item_7a", "title": "Quantitative and Qualitative Disclosures About Market Risk"},
                {"item": "item_8", "title": "Financial Statements and Supplementary Data"},
                {"item": "item_9", "title": "Changes in and Disagreements with Accountants"},
                {"item": "item_9a", "title": "Controls and Procedures"},
                {"item": "item_9b", "title": "Other Information"},
                {"item": "item_10", "title": "Directors, Executive Officers and Corporate Governance"},
                {"item": "item_11", "title": "Executive Compensation"},
                {"item": "item_12", "title": "Security Ownership of Certain Beneficial Owners"},
                {"item": "item_13", "title": "Certain Relationships and Related Transactions"},
                {"item": "item_14", "title": "Principal Accounting Fees and Services"},
                {"item": "item_15", "title": "Exhibits, Financial Statement Schedules"}
            ]
            toc_sections = generic_toc
            logger.info("Generated generic TOC with %d items", len(toc_sections))
        # Even for regular stocks, provide a minimal TOC if none found
        elif not toc_sections:
            logger.warning("No TOC found, creating minimal structure for %s", ticker)
            minimal_toc = [
                {"item": "item_1", "title": "Business"},
                {"item": "item_1a", "title": "Risk Factors"},
                {"item": "item_7", "title": "Management's Discussion and Analysis"},
                {"item": "item_8", "title": "Financial Statements"}
            ]
            toc_sections = minimal_toc
            logger.info("Generated minimal TOC with %d items", len(minimal_toc))

        # Deduplicate and clean TOC before returning
        def is_meaningful_title(title):
            return title and title.strip() and title.strip() != "."
        seen = set()
        filtered_toc_sections = []
        for entry in toc_sections:
            key = (entry["item"].lower(), entry["title"].strip().lower())
            if key not in seen and is_meaningful_title(entry["title"]):
                filtered_toc_sections.append(entry)
                seen.add(key)
        toc_sections = filtered_toc_sections

        # Extract and clean sections
        section_pattern = re.compile(r'ITEM\s+(\d+[A-Z]?)\s*[.:]?\s*(.*)', re.I)
        sections = {}
        current_section = None
        section_content = []
        raw_section_content = []

        text_elements = soup.find_all(string=True)
        for element in text_elements:
            text = element.strip()
            if not text:
                continue
            match = section_pattern.match(text)
            if match:
                if current_section and section_content:
                    cleaned_text = clean_text(' '.join(section_content))
                    if cleaned_text:
                        sections[f"item_{current_section.lower()}"] = {
                            "text": cleaned_text,
                            "raw_html": ' '.join(raw_section_content)
                        }
                        logger.info("Section parsed: item_%s, text length: %d", current_section.lower(), len(cleaned_text))
                    else:
                        logger.warning("Empty cleaned text for section: item_%s", current_section.lower())
                    section_content = []
                    raw_section_content = []
                current_section = match.group(1)
                section_content.append(text)
                raw_section_content.append(str(element.parent))
            elif current_section:
                section_content.append(text)
                raw_section_content.append(str(element.parent))
        if current_section and section_content:
            cleaned_text = clean_text(' '.join(section_content))
            if cleaned_text:
                sections[f"item_{current_section.lower()}"] = {
                    "text": cleaned_text,
                    "raw_html": ' '.join(raw_section_content)
                }
                logger.info("Final section parsed: item_%s, text length: %d", current_section.lower(), len(cleaned_text))
            else:
                logger.warning("Empty cleaned text for final section: item_%s", current_section.lower())

        # If no sections parsed, try alternate extraction methods
        if not sections:
            logger.warning("No sections parsed with standard method for %s; trying alternate methods", ticker)
            
            # Alternative 1: Look for div/section with item IDs or classes
            for item_num in range(1, 16):
                # Try common patterns for item sections in SEC filings
                item_key = f"item_{item_num}"
                
                # Method 1: Look for IDs
                item_div = soup.find(['div', 'section'], id=re.compile(rf'item[-_]?{item_num}', re.I))
                
                # Method 2: Look for classes
                if not item_div:
                    item_div = soup.find(['div', 'section'], class_=re.compile(rf'item[-_]?{item_num}', re.I))
                
                # Method 3: Look for h1-h6 with item text
                if not item_div:
                    header = soup.find(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'], 
                                      string=re.compile(rf'item\s+{item_num}', re.I))
                    if header:
                        item_div = header.find_parent(['div', 'section'])
                
                # If found, extract text
                if item_div:
                    text = clean_text(item_div.get_text())
                    if text and len(text) > 100:  # Avoid tiny/empty sections
                        sections[item_key] = {
                            "text": text,
                            "raw_html": str(item_div)
                        }
                        logger.info("Found section %s via alternate method, length: %d", item_key, len(text))
            
            # Alternative 2: Search for common section headers in text and extract content
            if not sections and (ticker.upper() == 'TSLA' or ticker.upper() in LARGE_CAP_TICKERS):
                logger.warning("Using special section extraction for %s", ticker)
                
                # For TSLA and other large companies, create artificial sections based on typical 10-K content
                # Extract a large chunk of text from the document
                full_text = clean_text(soup.get_text())
                
                # Create basic sections with portions of the content
                text_length = len(full_text)
                if text_length > 1000:
                    sections = create_artificial_sections(full_text, ticker, toc_sections)
                    if sections:
                        logger.info("Created %d artificial sections for %s", len(sections), ticker)
            
            # If still no sections, log with more details from the content
            if not sections:
                sample_content = soup.get_text(strip=True)[:250]
                logger.error("No sections parsed; sample content: %s", sample_content)
                return metadata, {}, []

        # Validate sections against TOC
        if toc_sections:
            toc_item_keys = {entry["item"] for entry in toc_sections}
            parsed_item_keys = set(sections.keys())
            missing_items = toc_item_keys - parsed_item_keys
            if missing_items:
                logger.warning("Missing TOC items in parsed sections: %s", missing_items)

        # Warn about missing metadata with detailed context
        for key, value in metadata.items():
            if value == "Not Found":
                sample_text = header_text[:200] if sec_header else (cover_page.text[:200] if cover_page else soup.get_text()[:200])
                logger.warning("%s not found; sample text: %s", key, sample_text)

        return metadata, sections, toc_sections
    except Exception as e:
        logger.error("Error parsing sections: %s, sample HTML: %s", str(e), html_content[:200])
        return metadata, {}, []

def create_artificial_sections(full_text, ticker, toc_sections):
    """Create artificial sections when normal section parsing fails"""
    sections = {}
    
    # Add a marker to indicate these are artificial sections
    sections["_artificial"] = True
    
    # If we have TOC sections, try to create a basic structure
    if toc_sections:
        # Divide text into roughly equal portions based on TOC items
        section_count = len(toc_sections)
        if section_count > 0:
            avg_section_size = len(full_text) // section_count
            
            # Create sections based on TOC items
            for i, toc_item in enumerate(toc_sections):
                start = i * avg_section_size
                end = (i + 1) * avg_section_size if i < section_count - 1 else len(full_text)
                
                section_text = full_text[start:end]
                if len(section_text) > 100:  # Avoid tiny sections
                    sections[toc_item["item"]] = {
                        "text": section_text,
                        "raw_html": f"<div>{section_text}</div>",  # Basic HTML wrapper
                        "_artificial": True  # Mark as artificial
                    }
                    logger.info("Created artificial section %s with %d chars", toc_item["item"], len(section_text))
    
    # If no sections created or no TOC, create basic default sections
    if len(sections) <= 1:  # Only has the _artificial marker
        # Create a few standard sections with portions of the text
        text_length = len(full_text)
        
        # Business (first 20%)
        start = 0
        end = text_length // 5
        sections["item_1"] = {
            "text": full_text[start:end],
            "raw_html": f"<div>{full_text[start:end]}</div>",
            "_artificial": True
        }
        
        # Risk Factors (next 20%)
        start = end
        end = start + text_length // 5
        sections["item_1a"] = {
            "text": full_text[start:end],
            "raw_html": f"<div>{full_text[start:end]}</div>",
            "_artificial": True
        }
        
        # MD&A (next 30%)
        start = end
        end = start + (text_length * 3) // 10
        sections["item_7"] = {
            "text": full_text[start:end],
            "raw_html": f"<div>{full_text[start:end]}</div>",
            "_artificial": True
        }
        
        # Financial Statements (remaining content)
        start = end
        sections["item_8"] = {
            "text": full_text[start:],
            "raw_html": f"<div>{full_text[start:]}</div>",
            "_artificial": True
        }
        
        logger.info("Created default artificial sections for %s", ticker)
    
    return sections

def parse_filing(ticker, form_type, year):
    try:
        html_content, full_content = fetch_sec_filing(ticker, form_type, year)
        if not html_content or not full_content:
            return {"error": "Filing could not be processed. Check ticker, form type, or year."}
        
        # Special case handling for TSLA
        if ticker.upper() == 'TSLA' and form_type == '10-K':
            # Try the special TSLA parser first
            logger.info("Attempting special TSLA 10-K parser")
            result = parse_tsla_filing(html_content, full_content, form_type, year)
            if result and not result.get("error"):
                return result
            logger.warning("Special TSLA parser failed, falling back to standard parser")
        
        metadata, sections, toc_sections = parse_sections(html_content, full_content, form_type, ticker)
        
        # Check if we created artificial sections
        using_artificial_sections = False
        
        # If sections were created artificially, mark this in the output
        if sections and "_artificial" in str(sections):
            using_artificial_sections = True
            logger.warning("Using artificially created sections for %s", ticker)
        
        structured_output = {
            **metadata,
            "table_of_contents": toc_sections,
            **{k: {'text': v['text']} for k, v in sections.items() if k.startswith('item_')},
            "_artificial_sections": using_artificial_sections
        }

        chunks = []
        for item, content in sections.items():
            if not item.startswith('item_'):
                continue
            chunk_list = chunk_text(content["text"], max_tokens=500, overlap=1)
            for i, chunk in enumerate(chunk_list):
                chunks.append({
                    "chunk_id": f"{item}_{i}",
                    "section": item,
                    "text": chunk,
                    "tokens": len(chunk.split()),
                    "source": f"{ticker}_{form_type}_{year}"
                })

        chunked_output = {"metadata": metadata, "chunks": chunks}
        
        result = {
            "structured": structured_output,
            "chunked": chunked_output
        }
        
        return result
    except Exception as e:
        logger.error("Error in parse_filing: %s", str(e))
        return {"error": f"Error processing SEC filing: {str(e)}"}

def parse_tsla_filing(html_content, full_content, form_type, year):
    """Custom parser specifically for Tesla 10-K filings"""
    try:
        logger.info("Using custom TSLA 10-K parser")
        
        # Extract documents from the full submission
        documents = re.findall(r"<DOCUMENT>(.*?)</DOCUMENT>", full_content, re.DOTALL | re.IGNORECASE)
        
        # Find the 10-K document
        form_document = None
        for doc in documents:
            type_match = re.search(r"<TYPE>(.*?)</TYPE>", doc, re.DOTALL | re.IGNORECASE)
            if type_match and type_match.group(1).strip() == form_type:
                text_match = re.search(r"<TEXT>(.*?)</TEXT>", doc, re.DOTALL | re.IGNORECASE)
                if text_match:
                    form_document = text_match.group(1)
                    logger.info("Found 10-K document for TSLA")
                    break
        
        if not form_document:
            # Try to find HTML in the full content as fallback
            html_start = full_content.find("<HTML>")
            html_end = full_content.rfind("</HTML>") + len("</HTML>")
            if html_start != -1 and html_end > html_start:
                form_document = full_content[html_start:html_end]
                logger.info("Using HTML content as fallback for TSLA")
            else:
                logger.warning("Could not find 10-K document for TSLA")
                return {"error": "Could not find 10-K document for TSLA"}
        
        # Parse document with BeautifulSoup
        soup = BeautifulSoup(form_document, 'lxml')
        
        # Extract metadata
        metadata = {
            "cik": "0001318605",  # Tesla's CIK
            "company": "Tesla, Inc.",
            "ticker": "TSLA",
            "form": form_type
        }
        
        # Define standard 10-K sections for Tesla
        standard_sections = [
            {"item": "item_1", "title": "Business"},
            {"item": "item_1a", "title": "Risk Factors"},
            {"item": "item_1b", "title": "Unresolved Staff Comments"},
            {"item": "item_2", "title": "Properties"},
            {"item": "item_3", "title": "Legal Proceedings"},
            {"item": "item_4", "title": "Mine Safety Disclosures"},
            {"item": "item_5", "title": "Market for Registrant's Common Equity"},
            {"item": "item_6", "title": "Selected Financial Data"},
            {"item": "item_7", "title": "Management's Discussion and Analysis"},
            {"item": "item_7a", "title": "Quantitative and Qualitative Disclosures About Market Risk"},
            {"item": "item_8", "title": "Financial Statements and Supplementary Data"},
            {"item": "item_9", "title": "Changes in and Disagreements with Accountants"},
            {"item": "item_9a", "title": "Controls and Procedures"},
            {"item": "item_9b", "title": "Other Information"},
            {"item": "item_10", "title": "Directors, Executive Officers and Corporate Governance"},
            {"item": "item_11", "title": "Executive Compensation"},
            {"item": "item_12", "title": "Security Ownership of Certain Beneficial Owners"},
            {"item": "item_13", "title": "Certain Relationships and Related Transactions"},
            {"item": "item_14", "title": "Principal Accounting Fees and Services"},
            {"item": "item_15", "title": "Exhibits, Financial Statement Schedules"}
        ]
        
        # Try multiple approaches to extract sections
        sections = {}
        
        # Method 1: Try to find sections by proper elements with IDs or specific classes
        for section_info in standard_sections:
            item_key = section_info["item"]
            item_num = item_key.replace("item_", "")
            title = section_info["title"]
            
            # Look for IDs like "item1" or "item-1" or classes with item names
            item_div = soup.find(['div', 'section'], id=re.compile(rf'item[-_]?{item_num}', re.I))
            if not item_div:
                item_div = soup.find(['div', 'section'], class_=re.compile(rf'item[-_]?{item_num}', re.I))
            
            # Look for headers with item text
            if not item_div:
                header = soup.find(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'], 
                                  string=re.compile(rf'item\s+{item_num}[.\s]+{title}', re.I))
                if header:
                    item_div = header.find_parent(['div', 'section'])
            
            # If found, extract text
            if item_div:
                text = clean_text(item_div.get_text())
                if text and len(text) > 100:  # Avoid tiny/empty sections
                    sections[item_key] = {
                        "text": text,
                        "raw_html": str(item_div)
                    }
                    logger.info(f"Found section {item_key} via element search, length: {len(text)}")
        
        # Method 2: Extract sections using regex patterns from the full text
        if len(sections) < 5:  # If we didn't find many sections via method 1
            logger.info("Using text pattern matching for TSLA sections")
            all_text = soup.get_text()
            
            # First try to identify sections by "Item X. Section Title" pattern
            for i in range(len(standard_sections)):
                current_item = standard_sections[i]["item"].replace("item_", "")
                current_title = standard_sections[i]["title"]
                
                # Skip if we already found this section
                if standard_sections[i]["item"] in sections:
                    continue
                
                # Pattern to find this section
                pattern = rf'Item\s+{current_item}\.?\s+{current_title}'
                
                # Find the start of this section
                match = re.search(pattern, all_text, re.IGNORECASE)
                if match:
                    start_pos = match.start()
                    
                    # Find the end of this section (start of next section or end of document)
                    end_pos = len(all_text)
                    if i < len(standard_sections) - 1:
                        next_item = standard_sections[i+1]["item"].replace("item_", "")
                        next_title = standard_sections[i+1]["title"]
                        next_pattern = rf'Item\s+{next_item}\.?\s+{next_title}'
                        next_match = re.search(next_pattern, all_text[start_pos+10:], re.IGNORECASE)
                        if next_match:
                            end_pos = start_pos + 10 + next_match.start()
                    
                    # Extract and clean the section text
                    section_text = all_text[start_pos:end_pos].strip()
                    cleaned_text = clean_text(section_text)
                    
                    if cleaned_text and len(cleaned_text) > 100:
                        sections[f"item_{current_item}"] = {
                            "text": cleaned_text,
                            "raw_html": section_text
                        }
                        logger.info(f"Extracted section item_{current_item} via text pattern, length: {len(cleaned_text)}")
        
        # Method 3: Try alternate patterns if we still don't have many sections
        if len(sections) < 5:
            logger.info("Using alternate pattern matching for TSLA sections")
            
            # Look for patterns like "ITEM X:" or "ITEM X ..." in HTML
            for section_info in standard_sections:
                item_key = section_info["item"]
                item_num = item_key.replace("item_", "")
                
                # Skip if we already found this section
                if item_key in sections:
                    continue
                
                # Alternative pattern
                alt_pattern = rf'ITEM\s+{item_num}[:.]\s+'
                matches = re.finditer(alt_pattern, form_document, re.IGNORECASE)
                
                for match in matches:
                    start_pos = match.start()
                    
                    # Find the end by looking for the next ITEM or end of document
                    end_match = re.search(r'ITEM\s+\d+[A-Za-z]?[:.]\s+', form_document[start_pos+10:], re.IGNORECASE)
                    end_pos = len(form_document)
                    if end_match:
                        end_pos = start_pos + 10 + end_match.start()
                    
                    # Extract and parse section
                    section_html = form_document[start_pos:end_pos]
                    section_soup = BeautifulSoup(section_html, 'lxml')
                    section_text = clean_text(section_soup.get_text())
                    
                    # If section is reasonably long, add it
                    if section_text and len(section_text) > 200:
                        sections[item_key] = {
                            "text": section_text,
                            "raw_html": section_html
                        }
                        logger.info(f"Extracted section {item_key} via alternate pattern, length: {len(section_text)}")
                        break  # Just take the first match
        
        # Method 4: As a last resort, look in different documents if we still don't have enough sections
        if len(sections) < 5 and len(documents) > 1:
            logger.info("Searching in other documents for TSLA sections")
            
            for doc in documents:
                doc_type = re.search(r"<TYPE>(.*?)</TYPE>", doc, re.IGNORECASE)
                
                # Skip the main document we already processed
                if doc_type and doc_type.group(1).strip() == form_type:
                    continue
                
                # Get the text
                text_match = re.search(r"<TEXT>(.*?)</TEXT>", doc, re.DOTALL | re.IGNORECASE)
                if text_match:
                    doc_text = text_match.group(1)
                    doc_soup = BeautifulSoup(doc_text, 'lxml')
                    all_doc_text = doc_soup.get_text()
                    
                    # Look for each missing section
                    for section_info in standard_sections:
                        item_key = section_info["item"]
                        item_num = item_key.replace("item_", "")
                        title = section_info["title"]
                        
                        # Skip if we already found this section
                        if item_key in sections:
                            continue
                        
                        # Look for the section
                        pattern = rf'Item\s+{item_num}\.?\s+{title}'
                        match = re.search(pattern, all_doc_text, re.IGNORECASE)
                        
                        if match:
                            logger.info(f"Found section {item_key} in alternate document")
                            
                            start_pos = match.start()
                            end_pos = len(all_doc_text)
                            
                            # Look for next section
                            next_match = re.search(r'Item\s+\d+[A-Za-z]?\.?\s+', all_doc_text[start_pos+10:], re.IGNORECASE)
                            if next_match:
                                end_pos = start_pos + 10 + next_match.start()
                            
                            # Extract and clean
                            section_text = all_doc_text[start_pos:end_pos].strip()
                            cleaned_text = clean_text(section_text)
                            
                            if cleaned_text and len(cleaned_text) > 100:
                                sections[item_key] = {
                                    "text": cleaned_text,
                                    "raw_html": section_text
                                }
                                logger.info(f"Extracted section {item_key} from alternate document, length: {len(cleaned_text)}")
        
        # If we found sections, create output
        if len(sections) >= 5:  # At least 5 meaningful sections
            logger.info(f"Successfully extracted {len(sections)} sections using TSLA special parser")
            
            # Create chunks
            chunks = []
            for item, content in sections.items():
                chunk_list = chunk_text(content["text"], max_tokens=500, overlap=1)
                for i, chunk in enumerate(chunk_list):
                    chunks.append({
                        "chunk_id": f"{item}_{i}",
                        "section": item,
                        "text": chunk,
                        "tokens": len(chunk.split()),
                        "source": f"TSLA_{form_type}_{year}"
                    })
            
            # Create final output
            structured_output = {
                **metadata,
                "table_of_contents": standard_sections,
                **{k: {'text': v['text']} for k, v in sections.items()}
            }
            
            chunked_output = {"metadata": metadata, "chunks": chunks}
            
            result = {
                "structured": structured_output,
                "chunked": chunked_output
            }
            
            return result
        else:
            logger.warning(f"Only found {len(sections)} sections with TSLA special parser, not enough for useful output")
            return {"error": "Not enough sections found with TSLA special parser"}
    
    except Exception as e:
        logger.error(f"Error in TSLA special parser: {str(e)}")
        return {"error": f"Error in TSLA special parser: {str(e)}"}

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python sec_parser.py <ticker> <form_type> <year>")
        sys.exit(1)
    
    ticker = sys.argv[1]
    form_type = sys.argv[2]
    year = sys.argv[3]
    
    try:
        # Limit excessive logging for large files
        logging.getLogger().setLevel(logging.WARNING)
        
        result = parse_filing(ticker, form_type, year)
        
        # For very large results, trim sections if needed
        if isinstance(result, dict) and "structured" in result and "chunked" in result:
            # Check if this is a large cap stock
            is_large_cap = ticker.upper() in LARGE_CAP_TICKERS
            
            # Define max sizes based on section importance and company size
            if is_large_cap:
                # Larger limits for large-cap companies like TSLA, AAPL, etc.
                max_sizes = {
                    "item_1": 80000,    # Business section
                    "item_1a": 120000,  # Risk factors
                    "item_7": 120000,   # MD&A
                    "item_8": 200000,   # Financial statements - largest usually
                    "default": 60000    # Default for other sections
                }
                max_chunks = 1500       # More chunks for large companies
            else:
                # Standard limits for smaller companies
                max_sizes = {
                    "item_1": 50000,    # Business section
                    "item_1a": 100000,  # Risk factors
                    "item_7": 100000,   # MD&A
                    "item_8": 150000,   # Financial statements
                    "default": 50000    # Default for other sections
                }
                max_chunks = 1000       # Standard chunk limit
            
            # Clean up sections
            for key, section in result["structured"].items():
                if not isinstance(section, dict) or "text" not in section:
                    continue
                    
                # Get appropriate max size
                max_size = max_sizes.get(key, max_sizes["default"])
                
                # Check if truncation needed
                if len(section["text"]) > max_size:
                    # For item_8 (financial statements), try to keep important tables
                    if key == "item_8" and len(section["text"]) > max_size:
                        # Try to find the most important tables
                        logger.warning(f"Smart truncating {key} financial statements from {len(section['text'])} characters")
                        
                        # Keep beginning and look for important tables with keywords
                        important_keywords = [
                            "consolidated balance sheets", 
                            "consolidated statements of operations",
                            "consolidated income statements",
                            "statements of income",
                            "statement of earnings",
                            "statements of cash flows",
                            "statements of stockholders",
                            "notes to consolidated"
                        ]
                        
                        # For large-cap companies, add more potential keywords
                        if is_large_cap:
                            additional_keywords = [
                                "consolidated statements of comprehensive income",
                                "consolidated statements of cash flows",
                                "consolidated statements of stockholders' equity",
                                "consolidated statements of changes in equity",
                                "consolidated statements of financial position",
                                "notes to financial statements"
                            ]
                            important_keywords.extend(additional_keywords)
                        
                        text = section["text"]
                        beginning = text[:25000] if is_large_cap else text[:20000]  # Keep larger first part for large caps
                        
                        # Try to find important tables
                        important_sections = []
                        for keyword in important_keywords:
                            pos = text.lower().find(keyword)
                            if pos >= 0:
                                # Extract a portion around this keyword
                                # For large caps, extract larger portions
                                extract_size = 15000 if is_large_cap else 10000
                                start = max(0, pos - 500)
                                end = min(len(text), pos + extract_size)
                                important_sections.append(text[start:end])
                        
                        # Combine sections with markers
                        if important_sections:
                            truncated_text = beginning + "\n\n... [CONTENT TRUNCATED] ...\n\n" + "\n\n... [SECTION BREAK] ...\n\n".join(important_sections)
                            if len(truncated_text) > max_size:
                                truncated_text = truncated_text[:max_size] + "... [TRUNCATED]"
                            section["text"] = truncated_text
                            logger.warning(f"Created smart extract for {key} with {len(important_sections)} important sections")
                        else:
                            section["text"] = section["text"][:max_size] + "... [TRUNCATED]"
                    else:
                        section["text"] = section["text"][:max_size] + "... [TRUNCATED]"
                    logger.warning(f"Truncated section {key} from {len(section['text'])} to {max_size} characters")
            
            # Limit the number of chunks if excessive
            if len(result["chunked"]["chunks"]) > max_chunks:
                result["chunked"]["chunks"] = result["chunked"]["chunks"][:max_chunks]
                result["chunked"]["_note"] = f"Limited to first {max_chunks} chunks due to size constraints"
                logger.warning(f"Limited output to {max_chunks} chunks due to size constraints")
        
        print(json.dumps(result))
    except Exception as e:
        error_result = {"error": f"Error in processing SEC filing: {str(e)}"}
        print(json.dumps(error_result))
        logger.error("Fatal error in main: %s", str(e))
        sys.exit(1)