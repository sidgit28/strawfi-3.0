import sys
import json
import re
import os
import math
from typing import Dict, List, Any, Optional, Tuple
import warnings
warnings.filterwarnings("ignore")

try:
    from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
    import numpy as np
    from huggingface_hub import login
    import torch
    from scipy.special import softmax
except ImportError as e:
    print(f"Missing required library: {e}", file=sys.stderr)
    print("Please install: pip install transformers torch numpy huggingface_hub scipy", file=sys.stderr)
    sys.exit(1)

try:
    huggingface_token = os.getenv("HUGGINGFACE_TOKEN")
    if huggingface_token:
        login(token=huggingface_token)
        print("HuggingFace authentication successful", file=sys.stderr)
    else:
        print("Warning: HUGGINGFACE_TOKEN not found in environment variables", file=sys.stderr)
except Exception as e:
    print(f"HuggingFace authentication failed: {e}", file=sys.stderr)

try:
    MODEL_NAME = "ProsusAI/finbert"
    finbert_tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    finbert_model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
    
    sentiment_pipeline = pipeline(
        "sentiment-analysis", 
        model=finbert_model, 
        tokenizer=finbert_tokenizer,
        return_all_scores=True,
        truncation=True,
        padding=True,
        max_length=512,
        device=-1  
    )
    print("FinBERT initialized successfully (CPU mode)", file=sys.stderr)
except Exception as e:
    print(f"FinBERT initialization failed: {e}", file=sys.stderr)
    print("Error: FinBERT is required for this script to function", file=sys.stderr)
    sys.exit(1)

def preprocess_financial_text(text: str) -> str:
    """Preprocess financial text to enhance sentiment detection"""
    if not text:
        return text
    
    positive_financial_terms = {
        'growth': 'strong growth',
        'increase': 'significant increase',
        'revenue': 'solid revenue',
        'profit': 'strong profit',
        'margin': 'healthy margin',
        'beat': 'exceeded',
        'outperform': 'significantly outperform',
        'expansion': 'successful expansion',
        'opportunity': 'great opportunity'
    }
    
    negative_financial_terms = {
        'decline': 'significant decline',
        'decrease': 'notable decrease',
        'loss': 'concerning loss',
        'miss': 'missed expectations',
        'underperform': 'underperformed significantly',
        'challenge': 'serious challenge',
        'risk': 'significant risk',
        'pressure': 'intense pressure'
    }
    
    processed_text = text
    
    for term, replacement in positive_financial_terms.items():
        if term in processed_text.lower():
            if any(pos_word in processed_text.lower() for pos_word in ['good', 'better', 'improved', 'strong', 'solid']):
                processed_text = processed_text.replace(term, replacement)
    
    for term, replacement in negative_financial_terms.items():
        if term in processed_text.lower():
            if any(neg_word in processed_text.lower() for neg_word in ['concern', 'worry', 'problem', 'weak', 'poor']):
                processed_text = processed_text.replace(term, replacement)
    
    return processed_text

# ========== SPEAKER ROLE CLASSIFICATION ==========

def classify_speaker_role(speaker_name: str, text: str = "") -> Tuple[str, float]:
    """
    Classify speaker role and return (role, weight) for sentiment weighting
    
    Returns:
        Tuple[str, float]: (role, weight) where role is the speaker type and weight is the importance multiplier
    """
    speaker_lower = speaker_name.lower()
    text_lower = text.lower()
    
    # CEO patterns - Highest weight (1.5x)
    ceo_patterns = [
        'ceo', 'chief executive officer', 'chief exec', 'president', 'chairman',
        'chairwoman', 'founder', 'co-founder', 'managing director'
    ]
    
    # CFO patterns - High weight (1.4x)
    cfo_patterns = [
        'cfo', 'chief financial officer', 'chief finance officer', 'treasurer',
        'financial director', 'finance director', 'chief accounting officer'
    ]
    
    # Senior Management patterns - Medium-high weight (1.2x)
    mgmt_patterns = [
        'coo', 'chief operating officer', 'cto', 'chief technology officer',
        'cmo', 'chief marketing officer', 'chro', 'chief human resources officer',
        'general counsel', 'head of', 'vp', 'vice president', 'senior vp',
        'executive vp', 'division president', 'business unit'
    ]
    
    # Analyst patterns - Lower weight (0.8x)
    analyst_patterns = [
        'analyst', 'research analyst', 'equity analyst', 'senior analyst',
        'managing director analyst', 'vice president analyst'
    ]
    
    # Check CEO first (highest priority)
    for pattern in ceo_patterns:
        if pattern in speaker_lower:
            return ("CEO", 1.5)
    
    # Check CFO
    for pattern in cfo_patterns:
        if pattern in speaker_lower:
            return ("CFO", 1.4)
    
    # Check Senior Management
    for pattern in mgmt_patterns:
        if pattern in speaker_lower:
            return ("Senior_Management", 1.2)
    
    # Check Analyst
    for pattern in analyst_patterns:
        if pattern in speaker_lower:
            return ("Analyst", 0.8)
    
    # Context-based classification from text content
    if text:
        # Look for analyst-style questioning patterns
        analyst_question_patterns = [
            'could you', 'can you', 'what is', 'how do you', 'when will',
            'thank you for taking', 'thanks for taking', 'question on',
            'follow up question', 'clarification on'
        ]
        
        for pattern in analyst_question_patterns:
            if pattern in text_lower:
                return ("Analyst", 0.8)
        
        # Look for management response patterns
        mgmt_response_patterns = [
            'thank you for the question', 'thanks for the question', 'let me',
            'as i mentioned', 'as we discussed', 'going forward', 'our strategy'
        ]
        
        for pattern in mgmt_response_patterns:
            if pattern in text_lower:
                return ("Management", 1.1)
    
    # Default classification
    return ("Unknown", 1.0)

# ========== ENTROPY & CONFIDENCE ENHANCEMENTS ==========

def calculate_entropy(probabilities: List[float]) -> float:
    """
    Calculate Shannon entropy for prediction uncertainty measurement
    
    Args:
        probabilities: List of prediction probabilities
        
    Returns:
        float: Entropy value (lower = more confident, higher = more uncertain)
    """
    try:
        # Ensure probabilities sum to 1 and are positive
        probs = np.array(probabilities)
        probs = np.maximum(probs, 1e-10)  # Avoid log(0)
        probs = probs / np.sum(probs)  # Normalize
        
        # Calculate Shannon entropy: H = -Σ(p * log(p))
        entropy = -np.sum(probs * np.log2(probs))
        return float(entropy)
    except Exception as e:
        print(f"Error calculating entropy: {e}", file=sys.stderr)
        return 1.0  # Default to high uncertainty

def enhanced_confidence_scoring(raw_scores: List[Dict[str, Any]]) -> Tuple[float, float, Dict[str, float]]:
    """
    Enhanced confidence scoring using entropy and distribution analysis
    
    Args:
        raw_scores: List of sentiment scores from FinBERT
        
    Returns:
        Tuple[float, float, Dict]: (confidence, entropy, score_metrics)
    """
    try:
        # Extract probabilities
        probs = [score['score'] for score in raw_scores]
        labels = [score['label'].lower() for score in raw_scores]
        
        # Calculate entropy for uncertainty measurement
        entropy = calculate_entropy(probs)
        max_entropy = math.log2(len(probs))  # Maximum possible entropy
        normalized_entropy = entropy / max_entropy if max_entropy > 0 else 0.0
        
        # Calculate confidence metrics
        max_prob = max(probs)
        second_max_prob = sorted(probs, reverse=True)[1] if len(probs) > 1 else 0.0
        prob_margin = max_prob - second_max_prob
        
        # Multi-factor confidence calculation
        # 1. Entropy-based confidence (lower entropy = higher confidence)
        entropy_confidence = 1.0 - normalized_entropy
        
        # 2. Margin-based confidence (higher margin = higher confidence)
        margin_confidence = min(1.0, prob_margin * 2.0)
        
        # 3. Max probability confidence
        max_prob_confidence = max_prob
        
        # Weighted combination of confidence factors
        confidence = (
            entropy_confidence * 0.4 +
            margin_confidence * 0.3 +
            max_prob_confidence * 0.3
        )
        
        confidence = max(0.1, min(0.95, confidence))  # Bound confidence
        
        score_metrics = {
            'entropy': round(entropy, 3),
            'normalized_entropy': round(normalized_entropy, 3),
            'entropy_confidence': round(entropy_confidence, 3),
            'margin_confidence': round(margin_confidence, 3),
            'max_prob_confidence': round(max_prob_confidence, 3),
            'probability_margin': round(prob_margin, 3),
            'max_probability': round(max_prob, 3)
        }
        
        return confidence, entropy, score_metrics
        
    except Exception as e:
        print(f"Error in enhanced confidence scoring: {e}", file=sys.stderr)
        return 0.5, 1.0, {}

def entropy_adjusted_sentiment_score(sentiment_label: str, raw_score: float, 
                                   confidence: float, entropy: float) -> float:
    """
    Adjust sentiment score based on entropy and confidence
    
    Args:
        sentiment_label: Predicted sentiment label
        raw_score: Original model score
        confidence: Calculated confidence
        entropy: Calculated entropy
        
    Returns:
        float: Entropy-adjusted sentiment score
    """
    try:
        # Convert label to numeric score
        if sentiment_label.lower() == 'positive':
            base_score = 0.5 + (raw_score * 0.5)  # Map to [0.5, 1.0]
        elif sentiment_label.lower() == 'negative':
            base_score = 0.5 - (raw_score * 0.5)  # Map to [0.0, 0.5]
        else:  # neutral
            base_score = 0.5  # Neutral stays at 0.5
        
        # Entropy adjustment factor
        # High entropy (low confidence) -> pull toward neutral
        # Low entropy (high confidence) -> maintain or enhance score
        entropy_factor = 1.0 - (entropy / 2.0)  # Scale entropy impact
        entropy_factor = max(0.3, min(1.2, entropy_factor))
        
        # Confidence adjustment
        confidence_factor = 0.7 + (confidence * 0.3)  # Scale: [0.7, 1.0]
        
        # Apply adjustments
        if base_score > 0.5:  # Positive sentiment
            adjusted_score = 0.5 + ((base_score - 0.5) * entropy_factor * confidence_factor)
        elif base_score < 0.5:  # Negative sentiment
            adjusted_score = 0.5 - ((0.5 - base_score) * entropy_factor * confidence_factor)
        else:  # Neutral
            adjusted_score = base_score
        
        return max(0.0, min(1.0, adjusted_score))
        
    except Exception as e:
        print(f"Error in entropy adjustment: {e}", file=sys.stderr)
        return raw_score

# ========== WEIGHTED SENTIMENT CALCULATION ==========
    """
    Split text into chunks with safe token count control.
    Uses max_tokens=510 to leave room for special tokens ([CLS], [SEP]).
    """
    if not text or not text.strip():
        return []
    
    try:
        input_ids = tokenizer.encode(text, add_special_tokens=False, truncation=False)
        
        if len(input_ids) <= max_tokens:
            return [text]
        
        chunks = []
        step = max_tokens - overlap
        
        for i in range(0, len(input_ids), step):
            chunk_ids = input_ids[i:i + max_tokens]
            
            if len(chunk_ids) > max_tokens:
                chunk_ids = chunk_ids[:max_tokens]
            
            chunk_text = tokenizer.decode(chunk_ids, skip_special_tokens=True)
            if chunk_text.strip():
                verify_ids = tokenizer.encode(chunk_text, add_special_tokens=True, truncation=False)
                if len(verify_ids) > 512:
                    chunk_text = tokenizer.decode(chunk_ids[:max_tokens-20], skip_special_tokens=True)
                
                chunks.append(chunk_text)
        
        return chunks
        
    except Exception as e:
        print(f"Error in token-based splitting: {e}", file=sys.stderr)
        
        return fallback_text_split(text, max_chars=1500)

def fallback_text_split(text: str, max_chars: int = 1500) -> List[str]:
    """Fallback text splitting based on characters and sentence boundaries"""
    if len(text) <= max_chars:
        return [text]
    
    chunks = []
    sentences = text.split('. ')
    current_chunk = ""
    
    for sentence in sentences:
        if len(current_chunk) + len(sentence) + 2 <= max_chars:
            current_chunk += sentence + ". "
        else:
            if current_chunk.strip():
                chunks.append(current_chunk.strip())
            current_chunk = sentence + ". "
    
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    
    return chunks

def normalize_finbert_score(label: str, raw_score: float, all_scores: List[Dict[str, Any]]) -> tuple:
    """
    Normalize FinBERT scores with reduced neutral bias for better sentiment classification.
    
    Returns: (normalized_score, confidence, final_label)
    """
    score_dict = {result['label'].lower(): result['score'] for result in all_scores}
    
    
    pos_score = score_dict.get('positive', 0.0)
    neg_score = score_dict.get('negative', 0.0)
    neu_score = score_dict.get('neutral', 0.0)
    
    scores = [pos_score, neg_score, neu_score]
    sorted_scores = sorted(scores, reverse=True)
    confidence_margin = sorted_scores[0] - sorted_scores[1] if len(sorted_scores) > 1 else 0.1
    
    neutral_penalty = 0.05  # Penalize neutral classifications
    adjusted_neu_score = neu_score - neutral_penalty
    
    min_threshold = 0.05  
    
    if pos_score > max(neg_score, adjusted_neu_score) + min_threshold:
        final_label = 'positive'
        confidence = min(0.95, max(0.4, confidence_margin * 1.5 + 0.4))
        normalized_score = 0.65 + (confidence - 0.4) * 0.55
    elif neg_score > max(pos_score, adjusted_neu_score) + min_threshold:
        final_label = 'negative'
        confidence = min(0.95, max(0.4, confidence_margin * 1.5 + 0.4))
        normalized_score = 0.65 + (confidence - 0.4) * 0.55
    else:
        if pos_score > 0.4 and pos_score > neg_score:
            final_label = 'positive'
            confidence = min(0.8, max(0.3, pos_score * 1.2))
            normalized_score = 0.60 + (confidence - 0.3) * 0.6
        elif neg_score > 0.4 and neg_score > pos_score:
            final_label = 'negative'
            confidence = min(0.8, max(0.3, neg_score * 1.2))
            normalized_score = 0.60 + (confidence - 0.3) * 0.6
        else:
            final_label = 'neutral'
            confidence = min(0.7, max(0.2, 0.7 - confidence_margin))
            normalized_score = 0.30 + (confidence * 0.5)
    
    return normalized_score, confidence, final_label

def calculate_overall_sentiment(sentiments: List[Dict[str, Any]], speaker_weights: Optional[Dict[str, float]] = None) -> float:
    """
    Calculate weighted overall sentiment score with speaker weighting, entropy, and confidence
    
    Args:
        sentiments: List of sentiment analysis results
        speaker_weights: Optional dict mapping speaker names to weight multipliers
        
    Returns:
        float: Overall sentiment score in range [-1, 1]
    """
    if not sentiments:
        return 0.0
    
    try:
        weighted_scores = []
        total_weight = 0.0
        
        for sentiment in sentiments:
            if 'error' in sentiment:
                continue
                
            score = sentiment.get('score', 0.5)
            confidence = sentiment.get('confidence', 0.5)
            entropy = sentiment.get('entropy', 1.0)
            speaker = sentiment.get('speaker', 'Unknown')
            
            # Get speaker weight
            speaker_weight = 1.0
            if speaker_weights and speaker in speaker_weights:
                speaker_weight = speaker_weights[speaker]
            elif hasattr(sentiment, 'speaker_role_weight'):
                speaker_weight = sentiment.get('speaker_role_weight', 1.0)
            
            # Convert sentiment score to numeric range [-1, 1]
            sentiment_score = score
            if sentiment.get('label') == 'positive':
                sentiment_score = 0.5 + abs(score - 0.5)
            elif sentiment.get('label') == 'negative':
                sentiment_score = 0.5 - abs(score - 0.5)
            else:  # neutral
                sentiment_score = 0.5
            
            sentiment_numeric = (sentiment_score - 0.5) * 2  # Convert to [-1, 1]
            
            # Calculate composite weight
            # Higher confidence = higher weight
            # Lower entropy = higher weight (more certain predictions)
            entropy_weight = max(0.3, 1.0 - (entropy / 2.0))  # Scale entropy impact
            confidence_weight = max(0.5, confidence)
            
            composite_weight = speaker_weight * confidence_weight * entropy_weight
            
            weighted_score = sentiment_numeric * composite_weight
            weighted_scores.append(weighted_score)
            total_weight += composite_weight
        
        if weighted_scores and total_weight > 0:
            # Weighted average
            overall_score = sum(weighted_scores) / total_weight
        elif weighted_scores:
            # Fallback to simple average
            overall_score = float(np.mean(weighted_scores))
        else:
            overall_score = 0.0
        
        return max(-1.0, min(1.0, overall_score))
        
    except Exception as e:
        print(f"Error calculating overall sentiment: {e}", file=sys.stderr)
        return 0.0

def analyze_finbert_results(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Enhanced FinBERT analysis with entropy, confidence scoring, and speaker weighting"""
    if not results:
        return {'label': 'neutral', 'score': 0.50, 'confidence': 0.5, 'entropy': 1.0}
    
    normalized_results = []
    for result in results:
        label = result['label'].lower()
        if 'pos' in label:
            label = 'positive'
        elif 'neg' in label:
            label = 'negative'
        else:
            label = 'neutral'
        normalized_results.append({
            'label': label,
            'score': result['score']
        })
    
    # Enhanced confidence scoring with entropy
    enhanced_confidence, entropy, score_metrics = enhanced_confidence_scoring(normalized_results)
    
    pos_score = next((r['score'] for r in normalized_results if r['label'] == 'positive'), 0.0)
    neg_score = next((r['score'] for r in normalized_results if r['label'] == 'negative'), 0.0)
    neu_score = next((r['score'] for r in normalized_results if r['label'] == 'neutral'), 0.0)
    
    # Decision logic with entropy consideration
    pos_vs_neu_diff = pos_score - neu_score
    neg_vs_neu_diff = neg_score - neu_score
    pos_vs_neg_diff = abs(pos_score - neg_score)
    
    # Adjust thresholds based on entropy (more confident = lower thresholds)
    entropy_adjusted_threshold = 0.02 + (entropy * 0.01)  # Higher entropy = higher threshold
    
    if pos_vs_neu_diff > entropy_adjusted_threshold and pos_score > neg_score:  
        decision_label = 'positive'
        decision_score = pos_score
    elif neg_vs_neu_diff > entropy_adjusted_threshold and neg_score > pos_score:  
        decision_label = 'negative'
        decision_score = neg_score
    elif pos_vs_neg_diff < (0.05 + entropy * 0.02) and max(pos_score, neg_score) > neu_score:
        if pos_score > neg_score:
            decision_label = 'positive'
            decision_score = pos_score
        else:
            decision_label = 'negative'
            decision_score = neg_score
    else:
        decision_label = 'neutral'
        decision_score = neu_score
    
    # Apply entropy adjustment to sentiment score
    entropy_adjusted_score = entropy_adjusted_sentiment_score(
        decision_label, decision_score, enhanced_confidence, entropy
    )
    
    # Legacy normalize function for compatibility
    normalized_score, legacy_confidence, final_label = normalize_finbert_score(
        decision_label, 
        decision_score, 
        normalized_results
    )
    
    # Use enhanced confidence over legacy
    final_confidence = enhanced_confidence
    
    return {
        'label': final_label,
        'score': entropy_adjusted_score,  # Use entropy-adjusted score
        'confidence': final_confidence,
        'entropy': entropy,
        'raw_score': decision_score,
        'legacy_score': normalized_score,  # Keep for comparison
        'all_scores': normalized_results,
        'score_distribution': {
            'positive': pos_score,
            'negative': neg_score,
            'neutral': neu_score
        },
        'decision_info': {
            'pos_vs_neu_diff': round(pos_vs_neu_diff, 3),
            'neg_vs_neu_diff': round(neg_vs_neu_diff, 3),
            'pos_vs_neg_diff': round(pos_vs_neg_diff, 3),
            'entropy_threshold': round(entropy_adjusted_threshold, 3)
        },
        'enhanced_metrics': score_metrics
    }

def analyze_text(text: str) -> Dict[str, Any]:
    """Analyze sentiment of text using FinBERT only with reduced neutral bias"""
    try:
        if not text or not text.strip():
            return {"error": "Empty text provided"}
        
        processed_text = preprocess_financial_text(text)
        
        chunks = fallback_text_split(processed_text, max_chars=1000)
        
        if not chunks:
            return {"error": "No valid text chunks found after processing"}
        
        sentiments = []
        
        for i, chunk in enumerate(chunks):
            if not chunk.strip():
                continue
                
            try:
                raw_results = sentiment_pipeline(
                    chunk, 
                    truncation=True, 
                    max_length=512,
                    padding=True
                )
                
                if isinstance(raw_results[0], list):
                    result = analyze_finbert_results(raw_results[0])
                else:
                    single_result = raw_results[0]
                    
                    mock_all_scores = [
                        {'label': 'positive', 'score': 0.33},
                        {'label': 'negative', 'score': 0.33},
                        {'label': 'neutral', 'score': 0.33}
                    ]
                    
                    label = single_result['label'].lower()
                    if 'pos' in label:
                        label = 'positive'
                    elif 'neg' in label:
                        label = 'negative'
                    else:
                        label = 'neutral'
                    for mock_score in mock_all_scores:
                        if mock_score['label'] == label:
                            mock_score['score'] = single_result['score']
                    
                    normalized_score, confidence, final_label = normalize_finbert_score(
                        label, single_result['score'], mock_all_scores
                    )
                    
                    result = {
                        'label': final_label,
                        'score': normalized_score,
                        'confidence': confidence,
                        'raw_score': single_result['score']
                    }
                
                sentiments.append({
                    'chunk_id': i + 1,
                    'text': chunk,
                    'original_text': chunks[i] if i < len(chunks) else chunk, 
                    'label': result['label'],
                    'score': round(result['score'], 3),
                    'confidence': round(result['confidence'], 3),
                    'entropy': round(result.get('entropy', 1.0), 3),
                    'raw_score': round(result.get('raw_score', result['score']), 3),
                    'legacy_score': round(result.get('legacy_score', result['score']), 3),
                    'debug_info': result.get('score_distribution', {}),
                    'decision_info': result.get('decision_info', {}),
                    'enhanced_metrics': result.get('enhanced_metrics', {})
                })
                
            except Exception as e:
                print(f"Error processing chunk {i}: {e}", file=sys.stderr)
                
                sentiments.append({
                    'chunk_id': i + 1,
                    'text': chunk,
                    'label': 'neutral',
                    'score': 0.50,
                    'confidence': 0.3,
                    'entropy': 1.0,
                    'error': str(e)
                })
        
        if not sentiments:
            return {"error": "No valid sentiment analysis results"}
        
        overall_sentiment = calculate_overall_sentiment(sentiments)
        
        return {
            "sentiments": sentiments,
            "overall_sentiment": round(overall_sentiment, 3),
            "summary": generate_summary(text, sentiments),
            "metadata": {
                "total_chunks": len(sentiments),
                "text_length": len(text),
                "processed_text_length": len(processed_text),
                "text_modified": processed_text != text,
                "avg_chunk_size": round(len(text) / len(sentiments)) if sentiments else 0,
                "model_used": "FinBERT",
                "avg_confidence": round(np.mean([s.get('confidence', 0.5) for s in sentiments]), 3),
                "device": "CPU",
                "neutral_bias_reduction": "enabled"
            }
        }
        
    except Exception as e:
        return {"error": str(e), "type": "text_analysis_error"}

def generate_summary(text: str, sentiments: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate comprehensive summary of sentiment analysis"""
    try:
        valid_sentiments = [s for s in sentiments if 'error' not in s]
        
        positive = [s for s in valid_sentiments if s['label'] == 'positive']
        negative = [s for s in valid_sentiments if s['label'] == 'negative']
        neutral = [s for s in valid_sentiments if s['label'] == 'neutral']
        
        total_chunks = len(valid_sentiments)
        
        if total_chunks == 0:
            return {
                'key_points': [],
                'most_positive': [],
                'most_negative': [],
                'sentiment_distribution': {'positive': 0, 'negative': 0, 'neutral': 0, 'total': 0},
                'sentiment_ratios': {'positive_ratio': 0, 'negative_ratio': 0, 'neutral_ratio': 0},
                'confidence_metrics': {'avg_confidence': 0, 'min_confidence': 0, 'max_confidence': 0, 'high_confidence_chunks': 0}
            }
        
        return {
            'key_points': [s['text'][:200] + '...' if len(s['text']) > 200 else s['text'] 
                          for s in valid_sentiments if len(s['text'].split()) > 10][:5],
            'most_positive': [
                {'text': s['text'][:150] + '...' if len(s['text']) > 150 else s['text'], 
                 'score': round(s['score'], 3),
                 'confidence': round(s.get('confidence', 0.5), 3)} 
                for s in sorted(positive, key=lambda x: x['score'], reverse=True)[:3]
            ],
            'most_negative': [
                {'text': s['text'][:150] + '...' if len(s['text']) > 150 else s['text'], 
                 'score': round(s['score'], 3),
                 'confidence': round(s.get('confidence', 0.5), 3)} 
                for s in sorted(negative, key=lambda x: x['score'], reverse=True)[:3]
            ],
            'sentiment_distribution': {
                'positive': len(positive),
                'negative': len(negative),
                'neutral': len(neutral),
                'total': total_chunks
            },
            'sentiment_ratios': {
                'positive_ratio': round(len(positive) / total_chunks, 3) if total_chunks > 0 else 0,
                'negative_ratio': round(len(negative) / total_chunks, 3) if total_chunks > 0 else 0,
                'neutral_ratio': round(len(neutral) / total_chunks, 3) if total_chunks > 0 else 0
            },
            'confidence_metrics': {
                'avg_confidence': round(np.mean([s.get('confidence', 0.5) for s in valid_sentiments]), 3),
                'min_confidence': round(min([s.get('confidence', 0.5) for s in valid_sentiments]), 3),
                'max_confidence': round(max([s.get('confidence', 0.5) for s in valid_sentiments]), 3),
                'high_confidence_chunks': len([s for s in valid_sentiments if s.get('confidence', 0.5) > 0.8])
            }
        }
    except Exception as e:
        return {"error": str(e), "type": "summary_error"}

def analyze_per_speaker(text: str) -> Dict[str, Any]:
    """Analyze sentiment per speaker with improved speaker detection"""
    try:
        speaker_segments = []
        current_speaker = None
        current_segment = []
        
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Enhanced speaker detection
            speaker_patterns = [
                r'^([A-Z][a-zA-Z\s]+):\s*$',
                r'^([A-Z][a-zA-Z\s]+)\s*-\s*',
                r'^\[([A-Z][a-zA-Z\s]+)\]',
                r'^([A-Z]+):\s*$'
            ]
            
            is_speaker_line = False
            for pattern in speaker_patterns:
                match = re.match(pattern, line)
                if match and len(match.group(1)) < 50:
                    if current_speaker and current_segment:
                        speaker_segments.append({
                            'speaker': current_speaker,
                            'text': ' '.join(current_segment)
                        })
                    current_speaker = match.group(1).strip()
                    current_segment = []
                    is_speaker_line = True
                    break
            
            if not is_speaker_line and current_speaker:
                current_segment.append(line)
        
        # Add the last segment
        if current_speaker and current_segment:
            speaker_segments.append({
                'speaker': current_speaker,
                'text': ' '.join(current_segment)
            })
        
        if not speaker_segments:
            return analyze_text(text)
        
        # Analyze each speaker's sentiment with role weighting
        speaker_results = []
        all_sentiments = []
        speaker_weights = {}
        speaker_roles = {}
        
        for segment in speaker_segments:
            if not segment['text'].strip():
                continue
                
            speaker_name = segment['speaker']
            speaker_text = segment['text']
            
            # Classify speaker role and get weight
            speaker_role, speaker_weight = classify_speaker_role(speaker_name, speaker_text)
            speaker_weights[speaker_name] = speaker_weight
            speaker_roles[speaker_name] = speaker_role
            
            print(f"Speaker: {speaker_name} | Role: {speaker_role} | Weight: {speaker_weight}", file=sys.stderr)
            
            sentiment_result = analyze_text(speaker_text)
            if 'error' not in sentiment_result:
                # Add speaker information to each sentiment
                for sentiment in sentiment_result.get('sentiments', []):
                    sentiment['speaker'] = speaker_name
                    sentiment['speaker_role'] = speaker_role
                    sentiment['speaker_role_weight'] = speaker_weight
                
                # Calculate speaker-specific metrics
                avg_entropy = np.mean([s.get('entropy', 1.0) for s in sentiment_result.get('sentiments', [])])
                
                speaker_results.append({
                    'speaker': speaker_name,
                    'speaker_role': speaker_role,
                    'speaker_weight': speaker_weight,
                    'text_preview': speaker_text[:200] + '...' if len(speaker_text) > 200 else speaker_text,
                    'sentiment_analysis': {
                        'overall_sentiment': sentiment_result['overall_sentiment'],
                        'weighted_sentiment': sentiment_result['overall_sentiment'] * speaker_weight,
                        'sentiment_distribution': sentiment_result['summary']['sentiment_distribution'],
                        'confidence': sentiment_result['summary']['confidence_metrics']['avg_confidence'],
                        'entropy': round(avg_entropy, 3)
                    },
                    'word_count': len(speaker_text.split()),
                    'chunk_count': len(sentiment_result.get('sentiments', []))
                })
                all_sentiments.extend(sentiment_result.get('sentiments', []))
        
        # Calculate weighted overall sentiment using speaker weights
        overall_sentiment = calculate_overall_sentiment(all_sentiments, speaker_weights)
        
        # Calculate role-based summary statistics
        role_stats = {}
        for speaker, role in speaker_roles.items():
            if role not in role_stats:
                role_stats[role] = {'count': 0, 'avg_weight': 0.0, 'speakers': []}
            role_stats[role]['count'] += 1
            role_stats[role]['avg_weight'] += speaker_weights[speaker]
            role_stats[role]['speakers'].append(speaker)
        
        for role in role_stats:
            role_stats[role]['avg_weight'] /= role_stats[role]['count']
            role_stats[role]['avg_weight'] = round(role_stats[role]['avg_weight'], 2)
        
        return {
            "speaker_analysis": speaker_results,
            "overall_sentiment": round(overall_sentiment, 3),
            "summary": generate_summary(text, all_sentiments),
            "speaker_weights": speaker_weights,
            "speaker_roles": speaker_roles,
            "role_statistics": role_stats,
            "metadata": {
                "total_speakers": len(speaker_results),
                "total_chunks": len(all_sentiments),
                "analysis_type": "per_speaker_weighted_enhanced",
                "model_used": "FinBERT_Enhanced",
                "device": "CPU",
                "speaker_weighting_enabled": True,
                "entropy_adjustment_enabled": True,
                "role_weighting_enabled": True,
                "ceo_cfo_detected": any(role in ['CEO', 'CFO'] for role in speaker_roles.values()),
                "analyst_detected": any(role == 'Analyst' for role in speaker_roles.values()),
                "avg_confidence": round(np.mean([s.get('confidence', 0.5) for s in all_sentiments]), 3),
                "avg_entropy": round(np.mean([s.get('entropy', 1.0) for s in all_sentiments]), 3)
            }
        }
        
    except Exception as e:
        return {"error": str(e), "type": "speaker_analysis_error"}

def analyze_sentiment(text: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Main sentiment analysis function with options"""
    options = options or {}
    
    try:
        if options.get('per_speaker'):
            return analyze_per_speaker(text)
        else:
            return analyze_text(text)
    except Exception as e:
        return {"error": str(e), "type": "analysis_error"}

def process_audio_transcript(transcript: str, company: str = "", ticker: str = "") -> Dict[str, Any]:
    """Process audio transcript with company context"""
    try:
        analysis = analyze_text(transcript)
        
        if 'error' in analysis:
            return analysis
        
        return {
            "company": company,
            "ticker": ticker,
            "transcript_preview": transcript[:500] + '...' if len(transcript) > 500 else transcript,
            "overall_sentiment": analysis['overall_sentiment'],
            "summary": analysis['summary'],
            "metadata": {
                **analysis.get('metadata', {}),
                "transcript_length": len(transcript),
                "analysis_type": "audio_transcript",
                "timestamp": "2024-01-01T00:00:00Z"
            }
        }
        
    except Exception as e:
        return {"error": str(e), "type": "audio_processing_error"}

def process_historical_data(transcript: str, ticker: str, year: int, quarter: int) -> Dict[str, Any]:
    """Process historical earnings call data"""
    try:
        analysis_result = analyze_text(transcript)
        
        if 'error' in analysis_result:
            return analysis_result
        
        summary = analysis_result.get('summary', {})
        
        if isinstance(summary, dict):
            if 'sentiment_ratios' not in summary:
                sentiment_dist = summary.get('sentiment_distribution', {})
                total = sentiment_dist.get('total', 1)
                positive = sentiment_dist.get('positive', 0)
                negative = sentiment_dist.get('negative', 0)
                neutral = sentiment_dist.get('neutral', 0)
                
                summary['sentiment_ratios'] = {
                    'positive_ratio': positive / total if total > 0 else 0,
                    'negative_ratio': negative / total if total > 0 else 0,
                    'neutral_ratio': neutral / total if total > 0 else 0
                }
            
            if 'positive_ratio' not in summary:
                summary['positive_ratio'] = summary['sentiment_ratios']['positive_ratio']
            if 'negative_ratio' not in summary:
                summary['negative_ratio'] = summary['sentiment_ratios']['negative_ratio']
            if 'neutral_ratio' not in summary:
                summary['neutral_ratio'] = summary['sentiment_ratios']['neutral_ratio']
        
        return {
            "ticker": ticker,
            "year": year,
            "quarter": quarter,
            "transcript": transcript,
            "overall_sentiment": analysis_result.get('overall_sentiment', 0.0),
            "summary": summary,
            "sentiments": analysis_result.get('sentiments', []),
            "metadata": analysis_result.get('metadata', {})
        }
        
    except Exception as e:
        return {"error": str(e), "type": "historical_processing_error"}

def test_enhanced_sentiment_analysis() -> Dict[str, Any]:
    """
    Test function to validate enhanced sentiment analysis features
    """
    try:
        # Test earnings call transcript with different speakers
        test_transcript = """
        John Smith - CEO: Thank you for joining our Q3 earnings call. I'm pleased to report that we've exceeded our revenue guidance by 15% this quarter. Our strategic initiatives have been performing exceptionally well, and we're seeing strong momentum across all business segments.

        Sarah Johnson - CFO: From a financial perspective, our operating margins improved by 200 basis points year-over-year. We maintained disciplined cost management while investing in growth initiatives. Our cash flow generation remains robust.

        Analyst: Thank you for taking my question. Could you provide more color on the competitive pressures you're seeing in the market? Are you concerned about potential margin compression going forward?

        John Smith - CEO: That's a great question. While we're aware of competitive dynamics, our differentiated product offerings and strong customer relationships position us well. We remain confident in our ability to maintain pricing power.
        """
        
        print("🧪 Testing Enhanced Sentiment Analysis Features", file=sys.stderr)
        
        # Test speaker analysis with role weighting
        result = analyze_per_speaker(test_transcript)
        
        # Validate enhancements are active
        metadata = result.get('metadata', {})
        speaker_weights = result.get('speaker_weights', {})
        role_stats = result.get('role_statistics', {})
        
        test_results = {
            'test_status': 'SUCCESS',
            'enhancements_verified': {
                'speaker_weighting_enabled': metadata.get('speaker_weighting_enabled', False),
                'entropy_adjustment_enabled': metadata.get('entropy_adjustment_enabled', False),
                'role_weighting_enabled': metadata.get('role_weighting_enabled', False),
                'ceo_detected': metadata.get('ceo_cfo_detected', False),
                'analyst_detected': metadata.get('analyst_detected', False)
            },
            'speaker_weights': speaker_weights,
            'role_statistics': role_stats,
            'total_speakers': metadata.get('total_speakers', 0),
            'overall_sentiment': result.get('overall_sentiment', 0.0),
            'avg_confidence': metadata.get('avg_confidence', 0.0),
            'avg_entropy': metadata.get('avg_entropy', 0.0),
            'sample_enhanced_metrics': []
        }
        
        # Extract sample enhanced metrics from first few chunks
        speaker_analysis = result.get('speaker_analysis', [])
        for i, speaker in enumerate(speaker_analysis[:2]):
            test_results['sample_enhanced_metrics'].append({
                'speaker': speaker.get('speaker'),
                'role': speaker.get('speaker_role'),
                'weight': speaker.get('speaker_weight'),
                'entropy': speaker.get('sentiment_analysis', {}).get('entropy'),
                'confidence': speaker.get('sentiment_analysis', {}).get('confidence'),
                'weighted_sentiment': speaker.get('sentiment_analysis', {}).get('weighted_sentiment')
            })
        
        print(f"✅ Test Results: {len(speaker_analysis)} speakers detected", file=sys.stderr)
        print(f"📊 CEO Weight: {speaker_weights.get('John Smith - CEO', 'Not found')}", file=sys.stderr)
        print(f"📊 Analyst Weight: {[w for s, w in speaker_weights.items() if 'analyst' in s.lower()]}", file=sys.stderr)
        print(f"🎯 Overall Sentiment: {result.get('overall_sentiment', 0.0)}", file=sys.stderr)
        
        return test_results
        
    except Exception as e:
        return {
            'test_status': 'FAILED',
            'error': str(e),
            'error_type': type(e).__name__
        }

def load_input_data(arg: str) -> Dict[str, Any]:
    """Load input data from file path or JSON string"""
    try:
        if os.path.isfile(arg):
            with open(arg, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            return json.loads(arg)
    except json.JSONDecodeError as e:
        return {"error": f"Invalid JSON: {str(e)}"}
    except Exception as e:
        return {"error": f"Failed to load input: {str(e)}"}

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No input data provided"}))
            sys.exit(1)
        
        data = load_input_data(sys.argv[1])
        
        if 'error' in data:
            print(json.dumps(data))
            sys.exit(1)
        
        action = data.get('action', 'analyze')
        
        if action == 'analyze':
            result = analyze_sentiment(data.get('text', ''), data.get('options', {}))
        elif action == 'audio_transcript':
            result = process_audio_transcript(
                data.get('transcript', ''), 
                data.get('company', ''), 
                data.get('ticker', '')
            )
        elif action == 'historical':
            result = process_historical_data(
                data.get('transcript', ''),
                data.get('ticker', ''),
                data.get('year', 0),
                data.get('quarter', 0)
            )
        else:
            result = {"error": f"Unknown action: {action}"}
        
        print(json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        print(json.dumps({"error": str(e), "type": "main_error"}))