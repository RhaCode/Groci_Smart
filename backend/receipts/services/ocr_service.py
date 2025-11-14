"""
Azure Computer Vision OCR Service
backend/receipts/services/ocr_service.py
"""

# import os
# from azure.cognitiveservices.vision.computervision import ComputerVisionClient
# from azure.cognitiveservices.vision.computervision.models import OperationStatusCodes
# from msrest.authentication import CognitiveServicesCredentials
# import time


# class AzureOCRService:
#     """Service for extracting text from receipt images using Azure Computer Vision"""
    
#     def __init__(self):
#         self.endpoint = os.getenv('AZURE_COMPUTER_VISION_ENDPOINT')
#         self.key = os.getenv('AZURE_COMPUTER_VISION_KEY')
        
#         if not self.endpoint or not self.key:
#             raise ValueError(
#                 "Azure Computer Vision credentials not found. "
#                 "Please set AZURE_COMPUTER_VISION_ENDPOINT and AZURE_COMPUTER_VISION_KEY"
#             )
        
#         self.client = ComputerVisionClient(
#             self.endpoint,
#             CognitiveServicesCredentials(self.key)
#         )
    
#     def extract_text_from_image(self, image_path):
#         """
#         Extract text from an image using Azure OCR Read API
        
#         Args:
#             image_path: Path to the image file
            
#         Returns:
#             dict: Contains 'text' (extracted text) and 'raw_result' (full API response)
#         """
#         try:
#             # Open the image file
#             with open(image_path, 'rb') as image_stream:
#                 # Call the API to read the image
#                 read_operation = self.client.read_in_stream(
#                     image_stream,
#                     raw=True
#                 )
            
#             # Get the operation location (URL with operation ID)
#             operation_location = read_operation.headers["Operation-Location"]
#             operation_id = operation_location.split("/")[-1]
            
#             # Wait for the operation to complete
#             max_retries = 10
#             retry_count = 0
#             while retry_count < max_retries:
#                 read_result = self.client.get_read_result(operation_id)
                
#                 if read_result.status not in [
#                     OperationStatusCodes.running,
#                     OperationStatusCodes.not_started
#                 ]:
#                     break
                
#                 time.sleep(1)
#                 retry_count += 1
            
#             # Check if operation succeeded
#             if read_result.status != OperationStatusCodes.succeeded:
#                 return {
#                     'success': False,
#                     'error': f'OCR operation failed with status: {read_result.status}',
#                     'text': '',
#                     'raw_result': None
#                 }
            
#             # Extract text from results
#             extracted_text = []
#             if read_result.analyze_result and read_result.analyze_result.read_results:
#                 for page in read_result.analyze_result.read_results:
#                     for line in page.lines:
#                         extracted_text.append(line.text)
            
#             full_text = '\n'.join(extracted_text)
            
#             return {
#                 'success': True,
#                 'text': full_text,
#                 'raw_result': read_result.as_dict(),
#                 'error': None
#             }
            
#         except FileNotFoundError:
#             return {
#                 'success': False,
#                 'error': f'Image file not found: {image_path}',
#                 'text': '',
#                 'raw_result': None
#             }
#         except Exception as e:
#             return {
#                 'success': False,
#                 'error': f'OCR error: {str(e)}',
#                 'text': '',
#                 'raw_result': None
#             }
    
#     def extract_text_from_url(self, image_url):
#         """
#         Extract text from an image URL using Azure OCR
        
#         Args:
#             image_url: URL of the image
            
#         Returns:
#             dict: Contains 'text' (extracted text) and 'raw_result' (full API response)
#         """
#         try:
#             # Call the API with image URL
#             read_operation = self.client.read(image_url, raw=True)
            
#             # Get operation location
#             operation_location = read_operation.headers["Operation-Location"]
#             operation_id = operation_location.split("/")[-1]
            
#             # Wait for operation to complete
#             max_retries = 10
#             retry_count = 0
#             while retry_count < max_retries:
#                 read_result = self.client.get_read_result(operation_id)
                
#                 if read_result.status not in [
#                     OperationStatusCodes.running,
#                     OperationStatusCodes.not_started
#                 ]:
#                     break
                
#                 time.sleep(1)
#                 retry_count += 1
            
#             if read_result.status != OperationStatusCodes.succeeded:
#                 return {
#                     'success': False,
#                     'error': f'OCR operation failed with status: {read_result.status}',
#                     'text': '',
#                     'raw_result': None
#                 }
            
#             # Extract text
#             extracted_text = []
#             if read_result.analyze_result and read_result.analyze_result.read_results:
#                 for page in read_result.analyze_result.read_results:
#                     for line in page.lines:
#                         extracted_text.append(line.text)
            
#             full_text = '\n'.join(extracted_text)
            
#             return {
#                 'success': True,
#                 'text': full_text,
#                 'raw_result': read_result.as_dict(),
#                 'error': None
#             }
            
#         except Exception as e:
#             return {
#                 'success': False,
#                 'error': f'OCR error: {str(e)}',
#                 'text': '',
#                 'raw_result': None
#             }
        