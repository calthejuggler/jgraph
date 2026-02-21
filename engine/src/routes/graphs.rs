use axum::{Json, http::StatusCode};

use crate::graph::{Graph, GraphParams};

pub async fn get_graph(
    Json(params): Json<GraphParams>,
) -> Result<(StatusCode, Json<serde_json::Value>), StatusCode> {
    params.validate()?;

    let graph = Graph::new(&params);

    Ok((StatusCode::OK, Json(graph.to_json(params.compact))))
}
