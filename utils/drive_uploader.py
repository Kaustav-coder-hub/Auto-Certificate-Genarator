import os
import logging
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

# Google Drive API setup
SCOPES = ['https://www.googleapis.com/auth/drive.file']
CLIENT_SECRETS_FILE = 'static/client_secret.json'
TOKEN_FILE = 'static/token.json'

def get_drive_service():
    """
    Initialize and return Google Drive service using OAuth
    
    Returns:
        googleapiclient.discovery.Resource: Drive service object
    """
    try:
        creds = None
        # The file token.json stores the user's access and refresh tokens
        if os.path.exists(TOKEN_FILE):
            creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
        
        # If there are no (valid) credentials available, let the user log in
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    CLIENT_SECRETS_FILE, SCOPES)
                creds = flow.run_local_server(port=0)
            
            # Save the credentials for the next run
            with open(TOKEN_FILE, 'w') as token:
                token.write(creds.to_json())
        
        service = build('drive', 'v3', credentials=creds)
        return service
    except Exception as e:
        logging.error(f"Error initializing Drive service: {e}")
        return None

def upload_certificate_to_drive(file_path: str, file_name: str, folder_id: str = None) -> str:
    """
    Upload certificate to Google Drive
    
    Args:
        file_path (str): Path to the certificate file
        file_name (str): Name for the file in Drive
        folder_id (str): Optional folder ID to upload to
        
    Returns:
        str: File ID of the uploaded file
        
    Raises:
        Exception: If upload fails
    """
    try:
        service = get_drive_service()
        if not service:
            raise Exception("Failed to initialize Google Drive service")
        
        # File metadata
        file_metadata = {
            'name': file_name,
        }
        
        # If folder_id is provided, set it as parent
        if folder_id:
            file_metadata['parents'] = [folder_id]
        
        # Upload file
        media = MediaFileUpload(file_path, resumable=True)
        
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id'
        ).execute()
        
        file_id = file.get('id')
        
        # Set file permissions to allow anyone with link to view
        set_file_permissions(service, file_id)
        
        logging.info(f"Certificate uploaded successfully. File ID: {file_id}")
        return file_id
        
    except Exception as e:
        logging.error(f"Error uploading certificate to Drive: {e}")
        raise

def set_file_permissions(service, file_id: str):
    """
    Set file permissions to allow anyone with link to view
    
    Args:
        service: Google Drive service object
        file_id (str): ID of the file
    """
    try:
        permission = {
            'type': 'anyone',
            'role': 'reader'
        }
        
        service.permissions().create(
            fileId=file_id,
            body=permission
        ).execute()
        
        logging.info(f"Permissions set for file ID: {file_id}")
        
    except Exception as e:
        logging.error(f"Error setting file permissions: {e}")

def create_drive_folder(folder_name: str, parent_folder_id: str = None) -> str:
    """
    Create a folder in Google Drive
    
    Args:
        folder_name (str): Name of the folder to create
        parent_folder_id (str): Optional parent folder ID
        
    Returns:
        str: ID of the created folder
    """
    try:
        service = get_drive_service()
        if not service:
            raise Exception("Failed to initialize Google Drive service")
        
        file_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        
        if parent_folder_id:
            file_metadata['parents'] = [parent_folder_id]
        
        folder = service.files().create(
            body=file_metadata,
            fields='id'
        ).execute()
        
        folder_id = folder.get('id')
        logging.info(f"Folder created successfully. Folder ID: {folder_id}")
        return folder_id
        
    except Exception as e:
        logging.error(f"Error creating Drive folder: {e}")
        raise

def list_drive_files(folder_id: str = None) -> list:
    """
    List files in Google Drive
    
    Args:
        folder_id (str): Optional folder ID to list files from
        
    Returns:
        list: List of files
    """
    try:
        service = get_drive_service()
        if not service:
            return []
        
        query = "trashed=false"
        if folder_id:
            query += f" and '{folder_id}' in parents"
        
        results = service.files().list(
            q=query,
            fields="files(id, name, createdTime, size)"
        ).execute()
        
        return results.get('files', [])
        
    except Exception as e:
        logging.error(f"Error listing Drive files: {e}")
        return []

def delete_drive_file(file_id: str) -> bool:
    """
    Delete a file from Google Drive
    
    Args:
        file_id (str): ID of the file to delete
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        service = get_drive_service()
        if not service:
            return False
        
        service.files().delete(fileId=file_id).execute()
        logging.info(f"File deleted successfully. File ID: {file_id}")
        return True
        
    except Exception as e:
        logging.error(f"Error deleting Drive file: {e}")
        return False
