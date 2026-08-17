from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('patrimoine', '0003_local_latitude_local_longitude'),
    ]

    operations = [
        migrations.AddField(
            model_name='local',
            name='photo_url',
            field=models.URLField(blank=True, max_length=500),
        ),
    ]
