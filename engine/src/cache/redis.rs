use redis::AsyncCommands;

const MAX_REDIS_SIZE: usize = 5 * 1024 * 1024; // 5 MB

#[derive(Clone)]
pub struct RedisCache {
    conn: redis::aio::MultiplexedConnection,
}

impl RedisCache {
    pub async fn new(url: &str) -> Result<Self, redis::RedisError> {
        let client = redis::Client::open(url)?;
        let conn = client.get_multiplexed_async_connection().await?;
        Ok(RedisCache { conn })
    }

    pub async fn get(&self, key: &str) -> Option<Vec<u8>> {
        let mut conn = self.conn.clone();
        conn.get::<_, Vec<u8>>(key)
            .await
            .ok()
            .filter(|v| !v.is_empty())
    }

    pub async fn put(&self, key: &str, data: &[u8]) {
        if data.len() > MAX_REDIS_SIZE {
            return;
        }
        let mut conn = self.conn.clone();
        let _: Result<(), _> = conn.set(key, data).await;
    }
}

pub fn fits_in_redis(data: &[u8]) -> bool {
    data.len() <= MAX_REDIS_SIZE
}
