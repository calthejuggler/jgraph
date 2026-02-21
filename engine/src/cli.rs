use clap::Parser;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
pub struct Args {
    #[arg(short, long)]
    pub num_balls: u8,
    #[arg(short, long)]
    pub max_height: u8,
}
