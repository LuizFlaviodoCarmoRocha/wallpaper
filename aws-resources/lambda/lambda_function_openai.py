import json
import boto3
import urllib3
import logging
import re

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Allowed origins for CORS
ALLOWED_ORIGINS = [
    'https://wallpaper.rbios.net',
    'https://dfag5wjhwtow6.cloudfront.net',  # CloudFront distribution
    'http://localhost:5173',  # Vite dev server
    'http://localhost:3000',  # Common dev server port
]

def get_cors_headers(origin=None):
    """Get CORS headers with proper origin handling"""
    # Check if origin is in allowed list
    allowed_origin = '*'  # Default fallback
    
    if origin and origin in ALLOWED_ORIGINS:
        allowed_origin = origin
    elif origin and origin.startswith('http://localhost:'):
        # Allow any localhost port for development
        allowed_origin = origin
    
    return {
        'Access-Control-Allow-Origin': allowed_origin,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',  # 24 hours
    }

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
        'max_tokens': 500,  # Increased for more facts
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
                return facts[:10]  # Cap at 10 facts
        except json.JSONDecodeError:
            pass
        
        # If not JSON, try to extract quoted strings
        fact_matches = re.findall(r'"([^"]+)"', content)
        if fact_matches:
            return fact_matches[:10]  # Cap at 10 facts
        
        # If no quotes, split by lines and clean up
        lines = [line.strip() for line in content.split('\n') if line.strip()]
        facts = []
        for line in lines:
            # Remove bullet points, numbers, etc.
            cleaned = re.sub(r'^[\d\.\-\*\s]+', '', line).strip()
            if cleaned and len(cleaned) > 10:  # Reasonable fact length
                facts.append(cleaned)
                if len(facts) >= 10:  # Cap at 10 facts
                    break
        
        return facts[:10] if facts else [content[:200] + "..."]  # Cap at 10 facts
        
    except Exception as e:
        logger.error(f"Error extracting facts: {str(e)}")
        return ["Error processing response"]

def generate_mock_facts(title, count=5):
    """Generate realistic astronomical facts based on the image title"""
    title_lower = title.lower()
    
    base_facts = []
    
    if any(word in title_lower for word in ['nebula', 'cloud', 'gas']):
        base_facts = [
            f"Nebulae like {title} are stellar nurseries where new stars are born from collapsing gas and dust.",
            f"The beautiful colors in {title} are created by different elements glowing at specific wavelengths.",
            f"This nebula spans several light-years across, containing enough material to form hundreds of stars.",
            f"The gas and dust in {title} are heated by nearby young, hot stars, causing them to glow.",
            f"Stellar winds from massive stars in {title} sculpt the surrounding material into intricate shapes.",
            f"The density of material in {title} is thousands of times less than Earth's atmosphere.",
            f"Radio telescopes can detect molecular hydrogen clouds within {title} that are invisible to optical telescopes."
        ]
    elif any(word in title_lower for word in ['galaxy', 'spiral', 'elliptical']):
        base_facts = [
            f"The galaxy {title} contains billions of stars, each potentially hosting planetary systems.",
            f"Galaxies like {title} are held together by dark matter, which makes up about 85% of all matter.",
            f"The supermassive black hole at the center of {title} influences the motion of stars throughout the galaxy.",
            f"Star formation in {title} creates distinctive spiral arms visible in optical light.",
            f"The disk of {title} rotates differentially, with inner regions moving faster than outer regions.",
            f"Globular clusters orbiting {title} contain some of the oldest stars in the universe.",
            f"Interactions with neighboring galaxies can trigger intense bursts of star formation in {title}."
        ]
    elif any(word in title_lower for word in ['cluster', 'group']):
        base_facts = [
            f"Star clusters like {title} formed from the same giant molecular cloud, making all stars roughly the same age.",
            f"The gravitational binding of {title} has kept these stars together for millions of years.",
            f"Open clusters like {title} will eventually disperse as gravitational interactions scatter the stars.",
            f"The brightest stars in {title} are also the most massive and will have the shortest lifespans.",
            f"Color differences among stars in {title} reveal their surface temperatures and evolutionary stages.",
            f"Binary star systems are common within {title}, with many stars having stellar companions.",
            f"The metallicity of stars in {title} provides clues about the chemical enrichment of the local galaxy."
        ]
    elif any(word in title_lower for word in ['supernova', 'explosion', 'remnant']):
        base_facts = [
            f"The supernova {title} released more energy in seconds than our Sun will produce in its entire lifetime.",
            f"Heavy elements forged in {title} are now scattered throughout space, enriching future star formation.",
            f"The shockwave from {title} continues to expand, heating and compressing nearby interstellar material.",
            f"Type Ia supernovae like {title} are used as 'standard candles' to measure cosmic distances.",
            f"The neutron star or black hole remnant of {title} may still be detectable today.",
            f"Radio emissions from {title} can be observed decades or centuries after the initial explosion.",
            f"The expanding shell of {title} creates a cavity in the interstellar medium called a superbubble."
        ]
    elif any(word in title_lower for word in ['planet', 'mars', 'jupiter', 'saturn', 'venus', 'mercury']):
        base_facts = [
            f"The atmospheric conditions on {title} create unique weather patterns unlike anything on Earth.",
            f"Studying {title} helps astronomers understand planetary formation in our solar system.",
            f"The surface features visible on {title} tell a story of billions of years of geological evolution.",
            f"The magnetic field of {title} interacts with solar wind in complex and dynamic ways.",
            f"Seasonal changes on {title} are caused by its axial tilt and orbital characteristics.",
            f"The moons of {title} may harbor subsurface oceans and potentially habitable environments.",
            f"Atmospheric composition of {title} provides insights into early solar system chemistry."
        ]
    else:
        base_facts = [
            f"The {title.lower()} represents one of the most fascinating phenomena in our universe.",
            f"Astronomical observations of objects like '{title}' help scientists understand the formation and evolution of cosmic structures.",
            f"The light captured in this image of {title.lower()} may have traveled millions or billions of years to reach us.",
            f"Modern telescopes reveal details in {title} that were impossible to observe just decades ago.",
            f"The wavelengths of light emitted by {title} tell us about its temperature, composition, and motion.",
            f"Computer simulations help astronomers understand the physical processes occurring in {title}.",
            f"Observations of {title} contribute to our understanding of fundamental physics and cosmology."
        ]
    
    # Return the requested number of facts, up to the available base facts
    return base_facts[:min(count, len(base_facts))]

def lambda_handler(event, context):
    # Get origin from headers for CORS
    origin = event.get('headers', {}).get('origin') or event.get('headers', {}).get('Origin')
    
    # Set up CORS headers based on origin
    headers = get_cors_headers(origin)
    
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
            match = re.search(r'"([^"]*)"', prompt)
            if match:
                title = match.group(1)
        
        # Extract requested number of facts from prompt (default to 5)
        fact_count = 5
        count_match = re.search(r'exactly (\d+)', prompt.lower())
        if count_match:
            fact_count = min(int(count_match.group(1)), 10)  # Cap at 10
        
        # Log request details (without sensitive info)
        logger.info(f"Request from origin: {origin}, for {fact_count} facts about: {title}")
        
        # Get OpenAI API key
        api_key = get_openai_api_key()
        
        if api_key and api_key != "your-openai-api-key-here":
            # Call OpenAI API
            openai_response = call_openai_api(prompt, api_key)
            
            if openai_response:
                facts = extract_facts_from_response(openai_response)
                logger.info(f"Successfully generated {len(facts)} facts via OpenAI")
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'facts': facts})
                }
        
        # Fallback to mock facts
        logger.info(f"Using fallback facts, generating {fact_count} facts")
        facts = generate_mock_facts(title, fact_count)
        
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
