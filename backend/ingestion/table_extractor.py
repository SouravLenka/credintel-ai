import pandas as pd
from io import BytesIO
from typing import Dict, Any, List

async def extract_tables(file_bytes: bytes, ext: str) -> List[Dict[str, Any]]:
    """
    Extracts structured data from CSV or Excel files.
    """
    try:
        if ext == ".csv":
            df = pd.read_csv(BytesIO(file_bytes))
        else:
            df = pd.read_excel(BytesIO(file_bytes))
            
        # Convert to records for easy JSON handling
        return df.to_dict(orient="records")
    except Exception as e:
        return [{"error": f"Table extraction failed: {str(e)}"}]
