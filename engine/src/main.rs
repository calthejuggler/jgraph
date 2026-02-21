mod graph;
mod routes;
mod state;
mod transition;

#[tokio::main]
async fn main() {
    let app = axum::Router::new().nest("/v1", routes::v1());

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8000").await.unwrap();
    println!("listening on port 8000");

    axum::serve(listener, app).await.unwrap();
}
