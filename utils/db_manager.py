import sqlite3
import os
import logging
from datetime import datetime
from typing import Dict, List, Optional

DATABASE_PATH = 'certificates.db'

def get_db_connection():
    """
    Get database connection with row factory
    
    Returns:
        sqlite3.Connection: Database connection
    """
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # This allows dict-like access to rows
    return conn

def init_database():
    """
    Initialize the database and create necessary tables
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create certificates table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS certificates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                event TEXT NOT NULL DEFAULT 'Certificate',
                drive_file_id TEXT NOT NULL,
                issued_at TEXT NOT NULL DEFAULT (datetime('now')),
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                UNIQUE(email, event)
            )
        ''')
        
        # Create index for faster queries
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_email_event 
            ON certificates(email, event)
        ''')
        
        conn.commit()
        conn.close()
        
        logging.info("Database initialized successfully")
        
    except Exception as e:
        logging.error(f"Database initialization error: {e}")

def save_certificate(name: str, email: str, event: str, drive_file_id: str, issued_at: str = None) -> bool:
    """
    Save certificate information to database
    
    Args:
        name (str): Participant name
        email (str): Participant email
        event (str): Event name
        drive_file_id (str): Google Drive file ID
        issued_at (str): Optional issue date
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if not issued_at:
            issued_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Insert or replace certificate
        cursor.execute('''
            INSERT OR REPLACE INTO certificates 
            (name, email, event, drive_file_id, issued_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (name, email.lower(), event, drive_file_id, issued_at))
        
        conn.commit()
        conn.close()
        
        logging.info(f"Certificate saved for {name} ({email})")
        return True
        
    except Exception as e:
        logging.error(f"Error saving certificate: {e}")
        return False

def verify_certificate_exists(email: str, event: str = None) -> Optional[Dict]:
    """
    Check if certificate exists for given email and event
    
    Args:
        email (str): Participant email
        event (str): Optional event name
        
    Returns:
        Optional[Dict]: Certificate data if found, None otherwise
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if event:
            cursor.execute('''
                SELECT * FROM certificates 
                WHERE email = ? AND event = ?
                ORDER BY created_at DESC
                LIMIT 1
            ''', (email.lower(), event))
        else:
            cursor.execute('''
                SELECT * FROM certificates 
                WHERE email = ?
                ORDER BY created_at DESC
                LIMIT 1
            ''', (email.lower(),))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return dict(result)
        else:
            return None
            
    except Exception as e:
        logging.error(f"Error verifying certificate: {e}")
        return None

def get_all_certificates() -> List[Dict]:
    """
    Get all certificates from database
    
    Returns:
        List[Dict]: List of all certificates
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM certificates 
            ORDER BY created_at DESC
        ''')
        
        results = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in results]
        
    except Exception as e:
        logging.error(f"Error getting certificates: {e}")
        return []

def get_certificates_by_event(event: str) -> List[Dict]:
    """
    Get certificates for a specific event
    
    Args:
        event (str): Event name
        
    Returns:
        List[Dict]: List of certificates for the event
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM certificates 
            WHERE event = ?
            ORDER BY created_at DESC
        ''', (event,))
        
        results = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in results]
        
    except Exception as e:
        logging.error(f"Error getting certificates by event: {e}")
        return []

def delete_certificate(email: str, event: str) -> bool:
    """
    Delete a certificate from database
    
    Args:
        email (str): Participant email
        event (str): Event name
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            DELETE FROM certificates 
            WHERE email = ? AND event = ?
        ''', (email.lower(), event))
        
        conn.commit()
        conn.close()
        
        logging.info(f"Certificate deleted for {email} in {event}")
        return True
        
    except Exception as e:
        logging.error(f"Error deleting certificate: {e}")
        return False

def get_certificate_stats() -> Dict:
    """
    Get certificate statistics
    
    Returns:
        Dict: Statistics about certificates
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Total certificates
        cursor.execute('SELECT COUNT(*) as total FROM certificates')
        total = cursor.fetchone()['total']
        
        # Certificates by event
        cursor.execute('''
            SELECT event, COUNT(*) as count 
            FROM certificates 
            GROUP BY event 
            ORDER BY count DESC
        ''')
        by_event = [dict(row) for row in cursor.fetchall()]
        
        # Recent certificates (last 7 days)
        cursor.execute('''
            SELECT COUNT(*) as recent 
            FROM certificates 
            WHERE created_at >= datetime('now', '-7 days')
        ''')
        recent = cursor.fetchone()['recent']
        
        conn.close()
        
        return {
            'total': total,
            'by_event': by_event,
            'recent': recent
        }
        
    except Exception as e:
        logging.error(f"Error getting certificate stats: {e}")
        return {'total': 0, 'by_event': [], 'recent': 0}
