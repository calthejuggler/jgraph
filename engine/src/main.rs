mod graph;
mod routes;
mod state;
mod transition;

use axum::extract::Request;
use axum::http::StatusCode;
use axum::middleware::Next;
use axum::response::Response;

async fn require_api_key(req: Request, next: Next) -> Result<Response, StatusCode> {
    let expected = std::env::var("ENGINE_API_KEY").unwrap_or_default();
    match req.headers().get("x-api-key") {
        Some(key) if key == expected.as_str() => Ok(next.run(req).await),
        _ => Err(StatusCode::UNAUTHORIZED),
    }
}

#[tokio::main]
async fn main() {
    let protected = routes::protected().layer(axum::middleware::from_fn(require_api_key));

    let app = axum::Router::new()
        .nest("/v1", protected)
        .nest("/v1", routes::public());

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8000").await.unwrap();
    println!("listening on port 8000");

    axum::serve(listener, app).await.unwrap();
}
