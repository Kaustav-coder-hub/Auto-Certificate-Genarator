import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.pdfbase import pdfutils
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfbase
from PyPDF2 import PdfReader, PdfWriter
import io
from PIL import Image
import pdf2image

def add_text_to_pdf(template_path: str, output_path: str, text: str, x: int, y: int, font_size: int = 24, font_name: str = "Helvetica"):
    """
    Add text overlay to a PDF template
    
    Args:
        template_path (str): Path to the template PDF
        output_path (str): Path for the output PDF
        text (str): Text to overlay
        x (int): X coordinate for text placement
        y (int): Y coordinate for text placement
        font_size (int): Font size for the text
        font_name (str): Font name to use
    """
    try:
        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Read the template PDF
        with open(template_path, 'rb') as template_file:
            pdf_reader = PdfReader(template_file)
            pdf_writer = PdfWriter()
            
            # Get the first page (assuming single page certificate)
            page = pdf_reader.pages[0]
            
            # Create a new PDF with the text overlay
            packet = io.BytesIO()
            can = canvas.Canvas(packet, pagesize=letter)
            
            # Set font and size
            can.setFont(font_name, font_size)
            
            # Add text at specified coordinates
            # Note: PDF coordinates start from bottom-left, so we might need to adjust
            page_height = float(page.mediabox.height)
            adjusted_y = page_height - y  # Convert from top-left to bottom-left coordinates
            
            can.drawString(x, adjusted_y, text)
            can.save()
            
            # Move to the beginning of the StringIO buffer
            packet.seek(0)
            
            # Create a new PDF with the overlay
            overlay_pdf = PdfReader(packet)
            overlay_page = overlay_pdf.pages[0]
            
            # Merge the overlay with the template
            page.merge_page(overlay_page)
            pdf_writer.add_page(page)
            
            # Write the result to output file
            with open(output_path, 'wb') as output_file:
                pdf_writer.write(output_file)
                
        return True
        
    except Exception as e:
        print(f"Error adding text to PDF: {e}")
        return False

def convert_pdf_to_image(pdf_path: str, output_path: str = None, dpi: int = 150) -> str:
    """
    Convert PDF first page to image for preview
    
    Args:
        pdf_path (str): Path to the PDF file
        output_path (str): Optional output path for image
        dpi (int): DPI for image conversion
        
    Returns:
        str: Path to the generated image
    """
    try:
        if not output_path:
            output_path = pdf_path.replace('.pdf', '_preview.png')
        
        # Convert PDF to images
        images = pdf2image.convert_from_path(pdf_path, dpi=dpi, first_page=1, last_page=1)
        
        if images:
            # Save first page as image
            images[0].save(output_path, 'PNG')
            return output_path
        else:
            raise Exception("No pages found in PDF")
            
    except Exception as e:
        print(f"Error converting PDF to image: {e}")
        return None

def get_pdf_dimensions(pdf_path: str) -> tuple:
    """
    Get dimensions of the PDF page
    
    Args:
        pdf_path (str): Path to the PDF file
        
    Returns:
        tuple: (width, height) in points
    """
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PdfReader(file)
            page = pdf_reader.pages[0]
            
            width = float(page.mediabox.width)
            height = float(page.mediabox.height)
            
            return (width, height)
            
    except Exception as e:
        print(f"Error getting PDF dimensions: {e}")
        return (595, 842)  # Default A4 size in points

def validate_pdf(pdf_path: str) -> bool:
    """
    Validate if the file is a proper PDF
    
    Args:
        pdf_path (str): Path to the PDF file
        
    Returns:
        bool: True if valid PDF, False otherwise
    """
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PdfReader(file)
            # Try to read the first page
            if len(pdf_reader.pages) > 0:
                return True
        return False
    except:
        return False
