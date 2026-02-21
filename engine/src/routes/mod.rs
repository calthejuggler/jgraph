mod graphs;
mod health;

use axum::Router;

pub fn v1() -> Router {
    Router::new()
        .route("/health", axum::routing::get(health::healthy))
        .route("/graphs", axum::routing::post(graphs::get_graph))
}
