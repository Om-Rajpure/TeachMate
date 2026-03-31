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

class MarkType(models.Model):
    name = models.CharField(max_length=50) # IA1, IA2, Viva, Assignment, EndSem
    max_marks = models.PositiveIntegerField()
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='mark_types')

    def __str__(self):
        return f"{self.subject.name} - {self.name} ({self.max_marks})"

class Mark(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='marks')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='marks')
    mark_type = models.ForeignKey(MarkType, on_delete=models.CASCADE, related_name='marks')
    marks_obtained = models.FloatField()

    class Meta:
        unique_together = ('student', 'subject', 'mark_type')

    def __str__(self):
        return f"{self.student.name} - {self.mark_type.name}: {self.marks_obtained}"

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
