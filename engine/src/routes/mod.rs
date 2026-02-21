mod graphs;
mod health;

use axum::Router;

pub fn protected() -> Router {
    Router::new().route("/graphs", axum::routing::post(graphs::get_graph))
}

pub fn public() -> Router {
    Router::new().route("/health", axum::routing::get(health::healthy))
}
