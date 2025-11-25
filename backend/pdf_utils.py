from reportlab.lib.pagesizes import letter, landscape
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from io import BytesIO

def generate_routine_pdf(routine):
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=landscape(letter))
    page_width, page_height = landscape(letter)

    # Margins and Dimensions
    margin_left = 50
    margin_right = 50
    margin_top = 50
    margin_bottom = 50
    
    grid_width = page_width - margin_left - margin_right
    grid_height = page_height - margin_top - margin_bottom - 50 # Reserve space for title
    
    all_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    weekend_days = routine.weekends.split(",") if routine.weekends else []
    days = [d for d in all_days if d not in weekend_days]
    
    row_height = grid_height / len(days) if days else 0
    
    # Title
    c.setFont("Helvetica-Bold", 24)
    c.drawString(margin_left, page_height - margin_top, f"Routine: {routine.name}")
    
    # Grid Start Position (Top-Left of grid)
    grid_top = page_height - margin_top - 40
    grid_left = margin_left + 80 # Space for Day labels
    actual_grid_width = grid_width - 80
    
    # Time Slots Config
    def parse_time(t_str):
        h, m = map(int, t_str.split(':'))
        return h * 60 + m

    def format_time(mins):
        h = mins // 60
        m = mins % 60
        return f"{h}:{m:02d}"

    start_mins = parse_time(routine.start_time)
    end_mins = parse_time(routine.end_time)
    total_minutes = end_mins - start_mins
    
    lunch_start_mins = parse_time(routine.lunch_start)
    
    slot_definitions = []
    current_mins = start_mins
    
    while current_mins < end_mins:
        # Check if it's lunch time
        if current_mins == lunch_start_mins:
            slot_definitions.append({
                "label": "Lunch",
                "mins": routine.lunch_duration,
                "is_lunch": True
            })
            current_mins += routine.lunch_duration
            continue
            
        # Regular slot
        next_mins = current_mins + routine.class_duration
        
        # If next slot overlaps lunch, cut it short or skip (simplified: assume perfect fit or cut)
        if current_mins < lunch_start_mins and next_mins > lunch_start_mins:
             next_mins = lunch_start_mins # Should not happen if aligned, but safety
        
        if next_mins > end_mins:
            break # Stop if exceeding end time
            
        label = f"{format_time(current_mins)} - {format_time(next_mins)}"
        slot_definitions.append({
            "label": label,
            "mins": next_mins - current_mins
        })
        current_mins = next_mins

    # Draw Headers
    current_x = grid_left
    lunch_x = 0
    lunch_width = 0
    
    for slot in slot_definitions:
        width = (slot["mins"] / total_minutes) * actual_grid_width
        
        # Capture lunch position for later drawing
        if slot.get("is_lunch"):
            lunch_x = current_x
            lunch_width = width
        
        # Draw Header Text centered
        c.setFont("Helvetica-Bold", 10) # Explicitly set font every time
        text_width = c.stringWidth(slot["label"], "Helvetica-Bold", 10)
        c.drawString(current_x + (width - text_width) / 2, grid_top + 5, slot["label"])
        
        # Draw Vertical Grid Line
        c.setStrokeColor(colors.grey)
        c.line(current_x, grid_top, current_x, grid_top - grid_height)
            
        current_x += width
    
    # Draw Final Vertical Line
    c.setStrokeColor(colors.grey)
    c.line(current_x, grid_top, current_x, grid_top - grid_height)

    # Draw Rows (Days)
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(colors.black)
    
    for i, day in enumerate(days):
        y_pos = grid_top - (i * row_height)
        
        # Day Label
        c.drawString(margin_left, y_pos - row_height/2 - 4, day)
        
        # Horizontal Line
        c.setStrokeColor(colors.grey)
        c.line(margin_left, y_pos, margin_left + grid_width, y_pos)

    # Draw Lunch Overlay (After grid lines to cover them)
    if lunch_width > 0:
        c.setFillColor(colors.lightgrey)
        # Draw rect over the grid area for lunch column
        c.rect(lunch_x, grid_top - grid_height, lunch_width, grid_height, fill=1, stroke=1)
        
        # Draw "LUNCH BREAK" vertical text
        c.saveState()
        c.translate(lunch_x + lunch_width/2, grid_top - grid_height/2)
        c.rotate(90)
        c.setFillColor(colors.gray)
        c.setFont("Helvetica-Bold", 16)
        c.drawCentredString(0, 0, "LUNCH BREAK")
        c.restoreState()

    # Helper function to wrap text into lines
    def wrap_text(text, max_width, font_name, font_size):
        if not text:
            return []
        
        words = text.split()
        lines = []
        current_line = []
        
        for word in words:
            test_line = ' '.join(current_line + [word])
            test_width = c.stringWidth(test_line, font_name, font_size)
            
            if test_width <= max_width:
                current_line.append(word)
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                    current_line = [word]
                else:
                    # Word itself is too long, try to fit or truncate
                    word_width = c.stringWidth(word, font_name, font_size)
                    if word_width > max_width:
                        # Truncate the long word
                        avail_chars = int(len(word) * max_width / word_width) - 2
                        if avail_chars > 0:
                            lines.append(word[:avail_chars] + "..")
                        else:
                            lines.append(word[:1] + "..")
                    else:
                        current_line = [word]
        
        if current_line:
            lines.append(' '.join(current_line))
        
        return lines

    # Draw Sessions
    for i, day in enumerate(days):
        y_pos = grid_top - (i * row_height)
        day_sessions = [s for s in routine.sessions if s.day == day]
        for session in day_sessions:
            try:
                # Calculate X position and Width
                h, m = map(int, session.start_time.split(':'))
                session_start_mins = h * 60 + m
                
                mins_from_start = session_start_mins - start_mins
                
                x_pos = grid_left + (mins_from_start / total_minutes) * actual_grid_width
                width = (session.duration / total_minutes) * actual_grid_width
                
                # Draw Session Box
                box_y = y_pos - row_height + 2
                box_height = row_height - 4
                
                if session.is_cancelled:
                    c.setFillColor(colors.lightgrey)
                    stroke_color = colors.grey
                else:
                    c.setFillColor(colors.lightblue)
                    stroke_color = colors.blue
                
                c.setStrokeColor(stroke_color)
                c.roundRect(x_pos, box_y, width, box_height, 4, fill=1, stroke=1)
                
                # Draw Text with improved layout: time above subject above location
                c.setFillColor(colors.black if not session.is_cancelled else colors.darkgrey)
                
                # Prepare text components
                time_text = session.start_time
                subject_text = session.subject
                location_text = session.location if session.location else ""
                
                if session.is_cancelled:
                    subject_text = f"(C) {subject_text}"
                
                max_text_width = width - 6  # Padding
                
                # Build all lines with their font specifications
                all_lines = []
                
                # Time (always on first line, bold, slightly bigger)
                time_width = c.stringWidth(time_text, "Helvetica-Bold", 9)
                if time_width <= max_text_width:
                    all_lines.append(("Helvetica-Bold", 9, time_text))
                else:
                    # If time doesn't fit, use smaller font
                    all_lines.append(("Helvetica-Bold", 7, time_text))
                
                # Subject (wrap if needed, bold for emphasis)
                subject_lines = wrap_text(subject_text, max_text_width, "Helvetica-Bold", 8)
                for line in subject_lines:
                    all_lines.append(("Helvetica-Bold", 8, line))
                
                # Location (if present, smaller font, regular weight)
                if location_text:
                    location_lines = wrap_text(location_text, max_text_width, "Helvetica", 7)
                    for line in location_lines:
                        all_lines.append(("Helvetica", 7, line))
                
                # Calculate how many lines we can fit
                line_height = 9
                max_lines = int((box_height - 4) / line_height)
                all_lines = all_lines[:max(1, max_lines)]
                
                # Calculate starting y position to center text vertically
                total_text_height = len(all_lines) * line_height
                start_y = box_y + (box_height + total_text_height) / 2 - line_height
                
                # Draw each line
                for idx, (font_name, font_size, text) in enumerate(all_lines):
                    c.setFont(font_name, font_size)
                    c.drawCentredString(x_pos + width/2, start_y - (idx * line_height), text)
                
            except ValueError:
                pass

    # Bottom Line
    c.setStrokeColor(colors.grey)
    c.line(margin_left, grid_top - grid_height, margin_left + grid_width, grid_top - grid_height)
    
    c.save()
    buffer.seek(0)
    return buffer
