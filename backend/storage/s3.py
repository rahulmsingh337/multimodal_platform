import boto3
from botocore.exceptions import ClientError
from config import settings

class S3Client:
    def __init__(self):
        self.client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
        )
        self.bucket = settings.S3_BUCKET
        self.cdn = settings.CLOUDFRONT_DOMAIN

    async def upload_bytes(self, data: bytes, key: str, content_type: str) -> str:
        import asyncio
        await asyncio.to_thread(
            self.client.put_object,
            Bucket=self.bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
        return f"{self.cdn}/{key}"

    async def upload_file(self, data: bytes, key: str, content_type: str) -> str:
        return await self.upload_bytes(data, key, content_type)

    def presigned_url(self, key: str, expires: int = 900) -> str:
        """Generate presigned URL. Default TTL: 15 minutes."""
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": key},
            ExpiresIn=expires,
        )

    def delete(self, key: str) -> None:
        self.client.delete_object(Bucket=self.bucket, Key=key)
