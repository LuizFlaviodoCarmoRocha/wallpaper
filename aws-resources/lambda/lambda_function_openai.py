import json
import boto3
import urllib3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def get_openai_api_key():
    """Retrieve OpenAI API key from AWS Secrets Manager"""
    secrets_client = boto3.client('secretsmanager', region_name='us-east-1')
    
    try:
        response = secrets_client.get_secret_value(SecretId='wallpaper-app/openai-api-key')
        secret = json.loads(response['SecretString'])
        return secret['OPENAI_API_KEY']
    except Exception as e:
        logger.error(f"Failed to retrieve API key: {str(e)}")
        return None

def call_openai_api(prompt, api_key):
    """Call OpenAI API using urllib3"""
    http = urllib3.PoolManager()
    
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    
    data = {
        'model': 'gpt-3.5-turbo',
        'messages': [
            {
                'role': 'user',
                'content': prompt
            }
        ],
        'max_tokens': 300,
        'temperature': 0.7
    }
    
    try:
        response = http.request(
            'POST',
            'https://api.openai.com/v1/chat/completions',
            body=json.dumps(data),
            headers=headers
        )
        
        if response.status == 200:
            return json.loads(response.data.decode('utf-8'))
        else:
            logger.error(f"OpenAI API error: {response.status} - {response.data.decode('utf-8')}")
            return None
            
    except Exception as e:
        logger.error(f"Error calling OpenAI API: {str(e)}")
        return None

def extract_facts_from_response(openai_response):
    """Extract facts array from OpenAI response"""
    try:
        content = openai_response['choices'][0]['message']['content']
        
        # Try to parse as JSON first
        try:
            facts = json.loads(content)
            if isinstance(facts, list):
                return facts[:3]  # Limit to 3 facts
        except json.JSONDecodeError:
            pass
        
        # If not JSON, try to extract quoted strings
        import re
        fact_matches = re.findall(r'"([^"]+)"', content)
        if fact_matches:
            return fact_matches[:3]
        
        # If no quotes, split by lines and clean up
        lines = [line.strip() for line in content.split('\n') if line.strip()]
        facts = []
        for line in lines:
            # Remove bullet points, numbers, etc.
            cleaned = re.sub(r'^[\d\.\-\*\s]+', '', line).strip()
            if cleaned and len(cleaned) > 10:  # Reasonable fact length
                facts.append(cleaned)
                if len(facts) >= 3:
                    break
        
        return facts[:3] if facts else [content[:200] + "..."]
        
    except Exception as e:
        logger.error(f"Error extracting facts: {str(e)}")
        return ["Error processing response"]

def generate_mock_facts(title):
    """Generate realistic astronomical facts based on the image title"""
    title_lower = title.lower()
    
    if any(word in title_lower for word in ['nebula', 'cloud', 'gas']):
        return [
            f"Nebulae like {title} are stellar nurseries where new stars are born from collapsing gas and dust.",
            f"The beautiful colors in {title} are created by different elements glowing at specific wavelengths.",
            f"This nebula spans several light-years across, containing enough material to form hundreds of stars."
        ]
    elif any(word in title_lower for word in ['galaxy', 'spiral', 'elliptical']):
        return [
            f"The galaxy {title} contains billions of stars, each potentially hosting planetary systems.",
            f"Galaxies like {title} are held together by dark matter, which makes up about 85% of all matter.",
            f"The supermassive black hole at the center of {title} influences the motion of stars throughout the galaxy."
        ]
    elif any(word in title_lower for word in ['cluster', 'group']):
        return [
            f"Star clusters like {title} formed from the same giant molecular cloud, making all stars roughly the same age.",
            f"The gravitational binding of {title} has kept these stars together for millions of years.",
            f"Open clusters like {title} will eventually disperse as gravitational interactions scatter the stars."
        ]
    elif any(word in title_lower for word in ['supernova', 'explosion', 'remnant']):
        return [
            f"The supernova {title} released more energy in seconds than our Sun will produce in its entire lifetime.",
            f"Heavy elements forged in {title} are now scattered throughout space, enriching future star formation.",
            f"The shockwave from {title} continues to expand, heating and compressing nearby interstellar material."
        ]
    elif any(word in title_lower for word in ['planet', 'mars', 'jupiter', 'saturn', 'venus', 'mercury']):
        return [
            f"The atmospheric conditions on {title} create unique weather patterns unlike anything on Earth.",
            f"Studying {title} helps astronomers understand planetary formation in our solar system.",
            f"The surface features visible on {title} tell a story of billions of years of geological evolution."
        ]
    else:
        return [
            f"The {title.lower()} represents one of the most fascinating phenomena in our universe.",
            f"Astronomical observations of objects like '{title}' help scientists understand the formation and evolution of cosmic structures.",
            f"The light captured in this image of {title.lower()} may have traveled millions or billions of years to reach us."
        ]

def lambda_handler(event, context):
    # Set up CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }
    
    # Handle preflight OPTIONS request
    if event['httpMethod'] == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    try:
        # Parse the request body
        body = json.loads(event['body'])
        prompt = body.get('prompt', '')
        
        if not prompt:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Missing prompt'})
            }
        
        # Extract title from prompt for fallback
        title = "Unknown Cosmic Object"
        if '"' in prompt:
            import re
            match = re.search(r'"([^"]*)"', prompt)
            if match:
                title = match.group(1)
        
        # Get OpenAI API key
        api_key = get_openai_api_key()
        
        if api_key and api_key != "your-openai-api-key-here":
            # Call OpenAI API
            openai_response = call_openai_api(prompt, api_key)
            
            if openai_response:
                facts = extract_facts_from_response(openai_response)
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'facts': facts})
                }
        
        # Fallback to mock facts
        logger.info("Using fallback facts")
        facts = generate_mock_facts(title)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'facts': facts})
        }
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }
