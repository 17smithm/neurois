fn main() {
    reset_folders();
    tauri_build::build()
}

fn reset_folders() {
    if std::path::Path::new("apps").exists() {
        std::fs::remove_dir_all("apps").unwrap();
    }

    std::fs::create_dir("apps").unwrap();
    std::fs::write("apps/~", "").unwrap();

    if std::path::Path::new("data").exists() {
        std::fs::remove_dir_all("data").unwrap();
    }

    std::fs::create_dir("data").unwrap();
    std::fs::write("data/~", b"").unwrap();
}