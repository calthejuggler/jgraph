use axum::http::StatusCode;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct GraphParams {
    pub num_balls: u8,
    pub max_height: u8,
    #[serde(default)]
    pub compact: bool,
}

impl GraphParams {
    pub fn validate(&self) -> Result<(), StatusCode> {
        if self.max_height > 32 {
            return Err(StatusCode::BAD_REQUEST);
        }
        if self.num_balls > 32 {
            return Err(StatusCode::BAD_REQUEST);
        }
        if self.max_height < self.num_balls {
            return Err(StatusCode::BAD_REQUEST);
        }
        Ok(())
    }
}
