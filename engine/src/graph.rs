use axum::http::StatusCode;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct GraphParams {
    pub num_props: u8,
    pub max_height: u8,
    #[serde(default)]
    pub compact: bool,
    #[serde(default)]
    pub reversed: bool,
}

impl GraphParams {
    pub fn validate(&self) -> Result<(), StatusCode> {
        self.to_library_params()
            .validate()
            .map_err(|_| StatusCode::BAD_REQUEST)
    }

    pub fn to_library_params(&self) -> juggling_tools::state_notation::GraphParams {
        juggling_tools::state_notation::GraphParams {
            num_props: self.num_props,
            max_height: self.max_height,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use juggling_tools::state_notation::MAX_MAX_HEIGHT;

    fn params(num_props: u8, max_height: u8) -> GraphParams {
        GraphParams {
            num_props,
            max_height,
            compact: false,
            reversed: false,
        }
    }

    #[test]
    fn test_validate_accepts_valid_params() {
        assert!(params(3, 5).validate().is_ok());
    }

    #[test]
    fn test_validate_rejects_max_height_above_limit() {
        assert_eq!(
            params(3, MAX_MAX_HEIGHT + 1).validate().unwrap_err(),
            StatusCode::BAD_REQUEST
        );
    }

    #[test]
    fn test_validate_rejects_num_props_above_limit() {
        assert_eq!(
            params(MAX_MAX_HEIGHT + 1, 5).validate().unwrap_err(),
            StatusCode::BAD_REQUEST
        );
    }

    #[test]
    fn test_validate_rejects_max_height_less_than_num_props() {
        assert_eq!(
            params(5, 3).validate().unwrap_err(),
            StatusCode::BAD_REQUEST
        );
    }

    #[test]
    fn test_validate_accepts_equal_num_props_and_max_height() {
        assert!(params(5, 5).validate().is_ok());
    }
}
