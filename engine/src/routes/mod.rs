pub mod graphs;
mod health;
pub mod table;

use axum::Router;

use crate::AppState;

pub fn protected() -> Router<AppState> {
    Router::new()
        .route(
            "/state-notation/graph",
            axum::routing::get(graphs::get_graph_query),
        )
        .route(
            "/state-notation/table",
            axum::routing::get(table::get_table_query),
        )
}

pub fn public() -> Router {
    Router::new().route("/health", axum::routing::get(health::healthy))
}
