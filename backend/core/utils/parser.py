import pandas as pd
import pdfplumber
import re
from datetime import datetime

class TimetableParser:
    DAYS_MAP = {
        'MON': 'Monday', 'TUE': 'Tuesday', 'WED': 'Wednesday', 
        'THU': 'Thursday', 'FRI': 'Friday', 'SAT': 'Saturday', 'SUN': 'Sunday',
        'MONDAY': 'Monday', 'TUESDAY': 'Tuesday', 'WEDNESDAY': 'Wednesday',
        'THURSDAY': 'Thursday', 'FRIDAY': 'Friday', 'SATURDAY': 'Saturday'
    }

    @staticmethod
    def parse_excel(file_path):
        """
        Parses an Excel timetable. 
        Expects Days in first column and Time Slots in header.
        """
        df = pd.read_excel(file_path, index_col=0)
        return TimetableParser._process_dataframe(df)

    @staticmethod
    def parse_pdf(file_path):
        """
        Parses a PDF timetable using pdfplumber to extract tables.
        """
        entries = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    if not table or len(table) < 2:
                        continue
                    
                    # Convert table to DataFrame
                    header = table[0]
                    data = table[1:]
                    df = pd.DataFrame(data, columns=header)
                    
                    # Set first column as index (Days)
                    day_col = header[0]
                    df.set_index(day_col, inplace=True)
                    
                    entries.extend(TimetableParser._process_dataframe(df))
        return entries

    @staticmethod
    def _process_dataframe(df):
        entries = []
        time_slots = df.columns
        
        for day_raw, row in df.iterrows():
            day = TimetableParser._map_day(str(day_raw))
            if not day:
                continue

            for slot_raw, cell in row.items():
                if pd.isna(cell) or not str(cell).strip():
                    continue
                
                # Parse time slot: "9:00 - 10:00" or "9:00-10:00"
                times = re.findall(r'(\d{1,2}:\d{2})', str(slot_raw))
                if len(times) < 2:
                    continue
                
                start_time, end_time = times[0], times[1]
                
                # Interpret cell content
                # Format: Subject \n Div/Batch \n Room
                cell_data = [line.strip() for line in str(cell).split('\n') if line.strip()]
                if not cell_data:
                    continue

                subject_code = cell_data[0]
                subject_type = 'Lab' if subject_code.upper().endswith('L') else 'Theory'
                clean_subject = subject_code[:-1] if subject_type == 'Lab' else subject_code

                division = ''
                batch = ''
                room = ''

                if len(cell_data) > 1:
                    # Look for Div/Batch: "TE-A" or "TE-A(B1)"
                    div_match = re.search(r'([A-Z0-9]+-[A-Z])(?:\(([A-Z0-9]+)\))?', cell_data[1])
                    if div_match:
                        division = div_match.group(1)
                        batch = div_match.group(2) if div_match.group(2) else ''
                    else:
                        division = cell_data[1]
                
                if len(cell_data) > 2:
                    room = cell_data[2]

                entries.append({
                    'day': day,
                    'start_time': start_time,
                    'end_time': end_time,
                    'subject_code': clean_subject,
                    'subject_type': subject_type,
                    'division': division,
                    'batch': batch,
                    'room': room,
                    'original_cell': str(cell)
                })
        
        return entries

    @staticmethod
    def parse_syllabus(file_path):
        """
        Parses an Excel syllabus.
        Expects columns: Chapter Name, CO, No. of Lectures Required, Lecture No, Topics.
        Handles merged cells and lecture ranges (e.g., 23-25).
        """
        df = pd.read_excel(file_path)
        
        # Clean column names
        df.columns = [str(c).strip() for c in df.columns]
        
        # Mapping rules
        col_map = {
            'chapter_name': ['Chapter Name', 'Chapter', 'Unit', 'Module'],
            'co': ['COs Covered', 'CO', 'Course Outcome'],
            'lecture_count': ['No. of Lectures Required', 'Total Lectures', 'Count'],
            'lecture_no': ['Lecture No', 'Lec No', 'Sr No'],
            'topic_name': ['Topics', 'Topic Name', 'Syllabus Topic']
        }
        
        def find_col(possible_names):
            for name in possible_names:
                for actual in df.columns:
                    if name.lower() in actual.lower():
                        return actual
            return None

        actual_cols = {k: find_col(v) for k, v in col_map.items()}
        
        # Handle merged cells for Chapter and CO
        for key in ['chapter_name', 'co', 'lecture_count']:
            if actual_cols[key]:
                df[actual_cols[key]] = df[actual_cols[key]].ffill()

        entries = []
        for _, row in df.iterrows():
            topic = str(row.get(actual_cols['topic_name'], '')).strip()
            if not topic or topic.lower() == 'nan':
                continue
            
            chapter = str(row.get(actual_cols['chapter_name'], 'Unknown')).strip()
            co = str(row.get(actual_cols['co'], '')).strip()
            
            count_raw = row.get(actual_cols['lecture_count'], 1)
            try:
                count = int(float(count_raw))
            except:
                count = 1

            lec_raw = str(row.get(actual_cols['lecture_no'], '')).strip()

            # Handle Lecture Range (e.g., 23-25)
            range_match = re.search(r'(\d+)\s*[-–]\s*(\d+)', lec_raw)
            if range_match:
                start, end = int(range_match.group(1)), int(range_match.group(2))
                for i in range(start, end + 1):
                    entries.append({
                        'chapter_name': chapter,
                        'co': co,
                        'lecture_count': count,
                        'lecture_number': i,
                        'topic_name': topic
                    })
            else:
                lec_no_match = re.search(r'(\d+)', lec_raw)
                if lec_no_match:
                    lec_no = int(lec_no_match.group(1))
                else:
                    lec_no = (entries[-1]['lecture_number'] + 1) if entries else 1
                
                entries.append({
                    'chapter_name': chapter,
                    'co': co,
                    'lecture_count': count,
                    'lecture_number': lec_no,
                    'topic_name': topic
                })

        return entries

    @staticmethod
    def parse_practical(file_path):
        """
        Parses an Excel experiment sheet.
        Expects columns: Experiment No, Experiment Name/Title.
        """
        df = pd.read_excel(file_path)
        
        # Clean column names
        df.columns = [str(c).strip() for c in df.columns]
        
        # Mapping rules for Practical/Lab
        col_map = {
            'exp_no': ['Experiment No', 'Exp No', 'Sr No', 'No', '#'],
            'title': ['Experiment Name', 'Experiment Title', 'Name of Experiment', 'Title', 'Experiment', 'Name']
        }
        
        def find_col(possible_names):
            for name in possible_names:
                for actual in df.columns:
                    if name.lower() in actual.lower():
                        return actual
            return None

        actual_cols = {k: find_col(v) for k, v in col_map.items()}
        
        if not actual_cols['title']:
            # Fallback if no specific title column: use the longest text column that isn't the index
            text_cols = df.select_dtypes(include=['object']).columns
            if len(text_cols) > 0:
                actual_cols['title'] = text_cols[0]

        entries = []
        for _, row in df.iterrows():
            title = str(row.get(actual_cols['title'], '')).strip()
            if not title or title.lower() == 'nan' or len(title) < 3:
                continue
            
            exp_no_raw = str(row.get(actual_cols['exp_no'], '')).strip()
            exp_no_match = re.search(r'(\d+)', exp_no_raw)
            if exp_no_match:
                exp_no = int(exp_no_match.group(1))
            else:
                exp_no = (entries[-1]['experiment_number'] + 1) if entries else 1
            
            entries.append({
                'experiment_number': exp_no,
                'title': title
            })

        return entries

    @staticmethod
    def _map_day(day_str):
        day_upper = day_str.strip().upper()
        return TimetableParser.DAYS_MAP.get(day_upper)

