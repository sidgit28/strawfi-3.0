import sys
import json
import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from the parent directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Supabase client
supabase: Client = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

def process_research_content(research_data):
    """
    Process the research content and perform any necessary analysis
    """
    try:
        research_id = research_data['research_id']
        content = research_data['content']
        research_type = research_data['type']
        tags = research_data['tags']


        # Update the research item with processed data
        processed_data = {
            'processed_content': content,  
            'analysis_status': 'completed',
            'metadata': {
                'type': research_type,
                'tags': tags,
                'word_count': len(content.split()),
                'processed_at': 'now()'
            }
        }

        # Update the research item in Supabase
        result = supabase.table('research').update(processed_data).eq('id', research_id).execute()
        
        print(f"Successfully processed research item {research_id}")
        return True

    except Exception as e:
        print(f"Error processing research content: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Error: No research data provided")
        sys.exit(1)

    try:
        research_data = json.loads(sys.argv[1])
        success = process_research_content(research_data)
        sys.exit(0 if success else 1)
    except json.JSONDecodeError:
        print("Error: Invalid JSON data provided")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1) 