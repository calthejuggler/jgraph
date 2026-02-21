use std::path::PathBuf;

use tokio::fs;
use tokio::io::AsyncWriteExt;

#[derive(Clone)]
pub struct FileCache {
    dir: PathBuf,
}

impl FileCache {
    pub async fn new(dir: PathBuf) -> Self {
        fs::create_dir_all(&dir).await.ok();
        FileCache { dir }
    }

    fn path(&self, key: &str) -> PathBuf {
        self.dir.join(key)
    }

    pub async fn get(&self, key: &str) -> Option<Vec<u8>> {
        fs::read(self.path(key)).await.ok()
    }

    pub async fn exists(&self, key: &str) -> bool {
        self.path(key).exists()
    }

    pub async fn put(&self, key: &str, data: &[u8]) {
        let final_path = self.path(key);
        let tmp_path = self.dir.join(format!(".{}.tmp", key));

        let result = async {
            let mut f = fs::File::create(&tmp_path).await?;
            f.write_all(data).await?;
            f.sync_all().await?;
            fs::rename(&tmp_path, &final_path).await
        }
        .await;

        if result.is_err() {
            fs::remove_file(&tmp_path).await.ok();
        }
    }
}
