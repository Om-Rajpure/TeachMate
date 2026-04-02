from django.core.management.base import BaseCommand
from core.tasks import run_periodic_tasks
import time

class Command(BaseCommand):
    help = 'Runs periodic tasks to generate notifications'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting notification engine...'))
        try:
            # We run it once for this command execution
            run_periodic_tasks()
            self.stdout.write(self.style.SUCCESS('Tasks executed successfully!'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Task execution failed: {str(e)}'))
