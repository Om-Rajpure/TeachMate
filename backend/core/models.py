from django.db import models

class Subject(models.Model):
    SUBJECT_TYPES = [
        ('theory', 'Theory'),
        ('practical', 'Practical'),
    ]
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    subject_type = models.CharField(
        max_length=20, 
        choices=SUBJECT_TYPES, 
        default='theory'
    )
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.code}) - {self.get_subject_type_display()}"

class Teacher(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.name

class Division(models.Model):
    name = models.CharField(max_length=10, unique=True)

    def __str__(self):
        return f"Division {self.name}"

class Batch(models.Model):
    name = models.CharField(max_length=10)
    division = models.ForeignKey(Division, on_delete=models.CASCADE, related_name='batches')

    def __str__(self):
        return f"{self.division.name} - {self.name}"

class Timetable(models.Model):
    DAYS_OF_WEEK = [
        ('Monday', 'Monday'),
        ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'),
        ('Friday', 'Friday'),
        ('Saturday', 'Saturday'),
    ]

    day = models.CharField(max_length=10, choices=DAYS_OF_WEEK)
    start_time = models.TimeField()
    end_time = models.TimeField()
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    subject_type = models.CharField(
        max_length=20, 
        choices=[('theory', 'Theory'), ('practical', 'Practical')],
        default='theory'
    )
    division = models.ForeignKey(Division, on_delete=models.CASCADE)
    batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True, blank=True)
    room = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.day}: {self.subject.name} ({self.start_time}-{self.end_time})"

class Student(models.Model):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class StudentSubject(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='subject_links')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='student_links')
    roll_number = models.IntegerField(null=True, blank=True)
    division = models.ForeignKey(Division, on_delete=models.CASCADE, null=True, blank=True)
    batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (('student', 'subject'), ('roll_number', 'subject', 'division'))

    def __str__(self):
        return f"{self.student.name} -> {self.subject.name} (Roll: {self.roll_number})"

class Chapter(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='chapters')
    name = models.CharField(max_length=200)
    co_covered = models.CharField(max_length=50, blank=True)
    total_lectures_required = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.subject.name}: {self.name}"

class LecturePlan(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='lecture_plans')
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name='lectures')
    lecture_number = models.PositiveIntegerField()
    topic_name = models.CharField(max_length=500)
    status = models.CharField(
        max_length=20, 
        choices=[('Pending', 'Pending'), ('Completed', 'Completed')], 
        default='Pending'
    )

    class Meta:
        ordering = ['lecture_number']
        unique_together = ('subject', 'lecture_number')

    def __str__(self):
        return f"L{self.lecture_number}: {self.topic_name}"

class Experiment(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='experiments')
    experiment_number = models.PositiveIntegerField()
    title = models.CharField(max_length=500)
    status = models.CharField(
        max_length=20, 
        choices=[('Pending', 'Pending'), ('Completed', 'Completed')], 
        default='Pending'
    )

    class Meta:
        ordering = ['experiment_number']
        unique_together = ('subject', 'experiment_number')

    def __str__(self):
        return f"Exp {self.experiment_number}: {self.title}"

class Lecture(models.Model):
    STATUS_CHOICES = [
        ('Completed', 'Completed'),
        ('Skipped', 'Skipped'),
    ]

    timetable = models.ForeignKey(Timetable, on_delete=models.CASCADE)
    date = models.DateField()
    topic = models.ForeignKey(LecturePlan, on_delete=models.SET_NULL, null=True, blank=True)
    experiment = models.ForeignKey(Experiment, on_delete=models.SET_NULL, null=True, blank=True)
    topic_taught = models.TextField(blank=True) # For manual entry if not in plan
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Completed')
    remarks = models.TextField(blank=True)

    class Meta:
        unique_together = ('timetable', 'date')

    def __str__(self):
        return f"{self.timetable.subject.name} on {self.date}"

class Attendance(models.Model):
    STATUS_CHOICES = [
        ('P', 'Present'),
        ('A', 'Absent'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_records')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='attendance')
    lecture_plan = models.ForeignKey(LecturePlan, on_delete=models.CASCADE, null=True, blank=True, related_name='attendance')
    experiment = models.ForeignKey(Experiment, on_delete=models.CASCADE, null=True, blank=True, related_name='attendance')
    date = models.DateField()
    status = models.CharField(max_length=1, choices=STATUS_CHOICES, default='P')
    marked_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        unique_together = ('student', 'subject', 'lecture_plan', 'experiment', 'date')

    def __str__(self):
        return f"{self.student.name} - {self.subject.name} - {self.date}"

class TheoryMark(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='theory_marks')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='theory_marks')
    year = models.CharField(max_length=20)
    branch = models.CharField(max_length=100)
    division = models.ForeignKey(Division, on_delete=models.CASCADE)
    exam_type = models.CharField(max_length=50) # IA1, IA2, EndSem
    marks_obtained = models.FloatField()
    max_marks = models.FloatField()
    pass_marks = models.FloatField()
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'subject', 'exam_type')

    def __str__(self):
        return f"{self.student.name} - {self.exam_type}: {self.marks_obtained}/{self.max_marks}"

class PracticalMark(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='practical_marks')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='practical_marks')
    division = models.ForeignKey(Division, on_delete=models.CASCADE)
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE)
    
    # Practical Exam (15 marks)
    part_a = models.FloatField(default=0)
    part_b = models.FloatField(default=0)
    part_c = models.FloatField(default=0)
    part_d = models.FloatField(default=0)
    
    # Assignments
    assign1_p1 = models.FloatField(default=0)
    assign1_p2 = models.FloatField(default=0)
    assign1_p3 = models.FloatField(default=0)
    assign2_p1 = models.FloatField(default=0)
    assign2_p2 = models.FloatField(default=0)
    assign2_p3 = models.FloatField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'subject')

    @property
    def total_marks(self):
        return (self.part_a + self.part_b + self.part_c + self.part_d + 
                self.assign1_p1 + self.assign1_p2 + self.assign1_p3 + 
                self.assign2_p1 + self.assign2_p2 + self.assign2_p3)

    def __str__(self):
        return f"{self.student.name} - {self.subject.name} Practical"

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('Reminder', 'Reminder'),
        ('Warning', 'Warning'),
        ('Info', 'Info'),
    ]

    title = models.CharField(max_length=200)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='Info')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.type}: {self.title}"

class ResourceFile(models.Model):
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to='resources/')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='resources')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.subject.name} - {self.title}"
class Marks(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='marks')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='marks')
    marks_data = models.JSONField(default=dict)
    experiments_total = models.FloatField(default=0)
    assignments_avg = models.FloatField(default=0)
    overall_total = models.FloatField(default=0)

    class Meta:
        unique_together = ('student', 'subject')

    def save(self, *args, **kwargs):
        if self.subject.subject_type == 'theory':
            ia1 = float(self.marks_data.get('ia1', 0))
            ia2 = float(self.marks_data.get('ia2', 0))
            avg = (ia1 + ia2) / 2
            self.marks_data['average'] = avg
            self.overall_total = avg
        elif self.subject.subject_type == 'practical':
            exps = self.marks_data.get('experiments', {})
            self.experiments_total = sum(float(v) for v in exps.values())
            
            assigns = self.marks_data.get('assignments', {})
            a1 = float(assigns.get('assignment_1', 0))
            a2 = float(assigns.get('assignment_2', 0))
            
            self.assignments_avg = (a1 + a2) / 2
            self.overall_total = self.experiments_total + a1 + a2
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.name} - {self.subject.name} Marks"
