use clap::Parser;

mod cli;
mod graph;
mod state;
mod state_set;
mod transition;

fn main() {
    let args = cli::Args::parse();

    let num_balls = args.num_balls;
    let max_height = args.max_height;

    let graph = graph::Graph::new(num_balls, max_height);

    graph.print();
}
