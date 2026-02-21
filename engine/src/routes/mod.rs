pub mod graphs;
mod health;

use axum::Router;

use crate::AppState;

pub fn protected() -> Router<AppState> {
    Router::new().route("/graphs", axum::routing::get(graphs::get_graph_query))
}

pub fn public() -> Router {
    Router::new().route("/health", axum::routing::get(health::healthy))
}
