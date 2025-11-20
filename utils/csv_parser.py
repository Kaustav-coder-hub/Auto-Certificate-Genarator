import csv
import os
from typing import List, Dict, Any

def parse_csv_file(csv_path: str) -> List[Dict[str, str]]:
    """
    Parse CSV file and return list of participant dictionaries
    
    Args:
        csv_path (str): Path to the CSV file
        
    Returns:
        List[Dict[str, str]]: List of participant data
        
    Raises:
        FileNotFoundError: If CSV file doesn't exist
        ValueError: If CSV format is invalid
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV file not found: {csv_path}")
    
    participants = []
    
    try:
        with open(csv_path, 'r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)
            
            # Validate required columns (case-insensitive)
            required_columns = ['name', 'email']
            fieldnames_lower = [col.lower() for col in csv_reader.fieldnames]
            if not all(col in fieldnames_lower for col in required_columns):
                raise ValueError(f"CSV must contain columns: {required_columns}")
            
            # Create mapping from lowercase to actual column names
            col_mapping = {col.lower(): col for col in csv_reader.fieldnames}
            
            for row_num, row in enumerate(csv_reader, start=2):  # Start from row 2 (header is row 1)
                # Validate required fields
                name_col = col_mapping.get('name')
                email_col = col_mapping.get('email')
                
                if not row.get(name_col, '').strip():
                    raise ValueError(f"Row {row_num}: Name is required")
                
                if not row.get(email_col, '').strip():
                    raise ValueError(f"Row {row_num}: Email is required")
                
                # Clean and validate email format
                email = row[email_col].strip().lower()
                if '@' not in email or '.' not in email:
                    raise ValueError(f"Row {row_num}: Invalid email format")
                
                participant = {
                    'name': row[name_col].strip(),
                    'email': email,
                    'event': row.get(col_mapping.get('event', ''), 'Certificate').strip() if 'event' in col_mapping else 'Certificate',
                    'date': row.get(col_mapping.get('date', ''), '').strip() if 'date' in col_mapping else '',
                    'venue': row.get(col_mapping.get('venue', ''), '').strip() if 'venue' in col_mapping else '',
                    'organizer': row.get(col_mapping.get('organizer', ''), '').strip() if 'organizer' in col_mapping else ''
                }
                
                participants.append(participant)
        
        if not participants:
            raise ValueError("CSV file is empty or contains no valid data")
            
        return participants
        
    except csv.Error as e:
        raise ValueError(f"CSV parsing error: {e}")
    except UnicodeDecodeError:
        raise ValueError("CSV file encoding error. Please save as UTF-8")

def get_sample_data(participants: List[Dict[str, str]]) -> Dict[str, str]:
    """
    Get sample data from the first participant for preview
    
    Args:
        participants (List[Dict[str, str]]): List of participants
        
    Returns:
        Dict[str, str]: Sample participant data
    """
    if not participants:
        return {
            'name': 'John Doe',
            'email': 'john@example.com',
            'event': 'Sample Event',
            'date': '2025-01-01'
        }
    
    return participants[0]

def validate_csv_structure(csv_path: str) -> Dict[str, Any]:
    """
    Validate CSV structure and return summary information
    
    Args:
        csv_path (str): Path to the CSV file
        
    Returns:
        Dict[str, Any]: Validation results and summary
    """
    try:
        participants = parse_csv_file(csv_path)
        
        return {
            'valid': True,
            'participant_count': len(participants),
            'columns': list(participants[0].keys()) if participants else [],
            'sample_data': get_sample_data(participants),
            'message': f'Successfully parsed {len(participants)} participants'
        }
        
    except Exception as e:
        return {
            'valid': False,
            'participant_count': 0,
            'columns': [],
            'sample_data': {},
            'message': str(e)
        }
