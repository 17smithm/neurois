// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::prelude::*; // for TcpStream
use std::{
    env, fs, io, net::TcpStream, path::Path, path::PathBuf, process::Command, str, string::String,
    sync::mpsc, thread,
};

use tauri::{App, Manager};
use tauri::Emitter;
use tracing::info;
use window_vibrancy::{apply_blur, apply_vibrancy, NSVisualEffectMaterial};

// const PATH: &str = "c:\\users\\mrs029\\desktop\\neurois\\src-tauri";

const NEWLINE: u8 = 10;
const STARTUP: u8 = 48; //     0, enable js pointer events (?). emitted when file sync finished
const APP_RELOAD: u8 = 64; //  @, refresh a src/ app or apps/ .html
const APPEND: u8 = 97; //      a, files
const WRITE: u8 = 119; //      w, files
const DELETE: u8 = 100; //     d, files
const FOLDER: u8 = 102; //     f, fodlers
const REMOVE: u8 = 114; //     r, folders

struct State {
    db_tx: mpsc::Sender<String>,
}

fn main() {
    tracing_subscriber::fmt::init();
    let (db_tx, db_rx) = mpsc::channel();
    let (event_tx_files, event_rx) = mpsc::channel();
    let event_tx_db = event_tx_files.clone();

    tauri::Builder::default()
        .manage(State { db_tx })
        .invoke_handler(tauri::generate_handler![
            send_db, read_app, read_file, is_file, get_cwd
        ])

        .setup(|app: &mut App| {
            let handle = app.app_handle();
            let window = handle.get_webview_window("main").unwrap();

            #[cfg(debug_assertions)] // only include this code on debug builds
            {
               //let window = app.get_window("main").unwrap();  
               window.open_devtools();
               window.close_devtools();
            }

            #[cfg(target_os = "windows")]
            {
                //let window = app.get_window("main").unwrap();
                apply_blur(&window, Some((255, 255, 255, 0)))
                   .expect("Unsupported platform! 'apply_blur' is only supported on Windows");
            }

            #[cfg(target_os = "macos")]
            {
               //let window = app.get_window("main").unwrap();
               apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
                   .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");
            }

            
            thread::spawn(move || {
                //let window = handle.get_webview_window("main").unwrap();
                loop {
                    println!("in event spawn thread");
                    let event: String = event_rx.recv().unwrap();
                    let msg: String = event_rx.recv().unwrap();
                    println!("event {}", event);
                    println!("msg {}", msg);
                    window.emit(&event, &msg).unwrap();
                }
            });


            // file calls stream
            tauri::async_runtime::spawn(async move {
                loop {

                    // open stream and use walk.py to 
                    let mut stream: TcpStream = match TcpStream::connect("localhost:8002") {
                        Ok(mut stream) => {
                            let path_buf: PathBuf = std::env::current_dir().unwrap();
                            let walk = Command::new("py")
                                .arg(format!("scripts\\walk.py"))
                                .arg(format!("{:?}", &path_buf).replace("\"", ""))
                                .output()
                                .unwrap();

                            for msg in walk.stdout.split(|bytecode| bytecode == &NEWLINE) {
                                let mut msg_buf: Vec<u8> = Vec::with_capacity(msg.len());
                                msg_buf.extend_from_slice(&msg);
                                match stream.write_all(&msg_buf) {
                                    Ok(()) => (),
                                    Err(_e) => continue,
                                }
                            }
                            stream
                        }
                        Err(_e) => {
                            std::thread::sleep(std::time::Duration::from_millis(250));
                            continue;
                        }
                    };

                    loop {
                        let mut head_buf = [0u8; 1];
                        match stream.read_exact(&mut head_buf) {
                            Ok(()) => (),
                            Err(_e) => break,
                        }

                        let mut path_len_buf = [0u8; 8];
                        match stream.read_exact(&mut path_len_buf) {
                            Ok(()) => (),
                            Err(_e) => break,
                        }

                        let mut path_buf = vec![0u8; usize::from_be_bytes(path_len_buf)];
                        match stream.read_exact(&mut path_buf) {
                            Ok(()) => (),
                            Err(_e) => break,
                        }

                        let mut path = String::from_utf8(path_buf).unwrap();
                        if path.contains(".") {
                            path = path[..path.find('.').unwrap()].to_string();
                        }

                        let path_format = path.replace("\\", "_").replace("/", "_");
                        info!("mode {:?} \tpath {}", &head_buf[0], &path);
                        // println!("received event", );

                        match &head_buf[0] {
                            &STARTUP => {
                                event_tx_files.send(String::from("startup")).unwrap();
                                event_tx_files.send(String::from("0")).unwrap();
                            }
                            &APP_RELOAD => {
                                event_tx_files.send(String::from("app_reset")).unwrap();
                                event_tx_files.send(path_format.clone()).unwrap();
                            }
                            &DELETE => fs::remove_file(path).unwrap(),
                            &REMOVE => fs::remove_dir_all(path).unwrap(),
                            &FOLDER => fs::create_dir(path).unwrap(),
                            &APPEND => {
                                let mut data_len_buf = [0u8; 8];
                                match stream.read_exact(&mut data_len_buf) {
                                    Ok(()) => (),
                                    Err(_e) => break,
                                }

                                let data_len = usize::from_be_bytes(data_len_buf);
                                if data_len == 0 {
                                    break;
                                }

                                let mut data_buf = vec![0u8; data_len];
                                match stream.read_exact(&mut data_buf) {
                                    Ok(()) => (),
                                    Err(_e) => break,
                                }

                                if path.starts_with("apps") {
                                    break;
                                } else if path.starts_with("data") {
                                    fs::OpenOptions::new()
                                        .append(true)
                                        .open(path)
                                        .unwrap()
                                        .write_all(&data_buf)
                                        .unwrap();

                                    let data = str::from_utf8(&data_buf[..data_buf.len() - 1])
                                        .unwrap()
                                        .replace("\n", ",");
                                    let data = format!("[{}]", &data);
                                    let event = format!("{}_call", &path_format);

                                    event_tx_files.send(event).unwrap();
                                    event_tx_files.send(data).unwrap();
                                }
                            }
                            &WRITE => {
                                let mut data_len_buf = [0u8; 8];
                                match stream.read_exact(&mut data_len_buf) {
                                    Ok(()) => (),
                                    Err(_e) => break,
                                }
                                if path.starts_with("data") {
                                    event_tx_files.send(String::from("app_reset")).unwrap();
                                    event_tx_files.send(path_format.clone()).unwrap();
                                }

                                let data_len = usize::from_be_bytes(data_len_buf);
                                if data_len == 0 {
                                    if path.starts_with("data") {
                                        fs::write(path.clone(), b"").unwrap();
                                    } else if path.starts_with("apps") {
                                        fs::write(path.clone() + ".html", b"").unwrap();
                                    }
                                    break;
                                }

                                let mut data_buf = vec![0u8; data_len];
                                match stream.read_exact(&mut data_buf) {
                                    Ok(()) => (),
                                    Err(_e) => break,
                                }

                                let data_format = str::from_utf8(&data_buf[..data_buf.len() - 1])
                                    .unwrap()
                                    .replace("\n", ",");

                                if path.starts_with("data") {
                                    fs::write(path.clone(), &data_buf).unwrap();
                                    let data = format!("[{}]", &data_format);
                                    let event = format!("{}_call", &path_format);
                                    event_tx_files.send(event).unwrap();
                                    event_tx_files.send(data).unwrap();
                                } else if path.starts_with("apps") {
                                    fs::write(path.clone() + ".html", &data_buf).unwrap();
                                }
                            }
                            _ => break,
                        }
                    }
                }
            });

            // db calls stream
            tauri::async_runtime::spawn(async move {
                loop {
                    let mut stream = match TcpStream::connect("localhost:8001") {
                        Ok(stream) => {
                            while let Ok(_) = db_rx.try_recv() {}
                            event_tx_db.send(String::from("db_reset")).unwrap();
                            event_tx_db.send(String::from("0")).unwrap();
                            stream
                        }
                        Err(_e) => {
                            std::thread::sleep(std::time::Duration::from_millis(250));
                            continue;
                        }
                    };

                    loop {
                        let event: String = db_rx.recv().unwrap();
                        let msg: String = db_rx.recv().unwrap();
                        let mut msg_buf: Vec<u8> = Vec::with_capacity(msg.len() + 8);
                        msg_buf.extend_from_slice(&msg.len().to_be_bytes());
                        msg_buf.extend_from_slice(&msg.as_bytes());

                        match stream.write_all(&msg_buf) {
                            Ok(()) => (),
                            Err(_e) => break,
                        }

                        match stream.flush() {
                            Ok(()) => (),
                            Err(_e) => break,
                        }

                        let mut msg_out_len_buf = [0u8; 8];
                        match stream.read_exact(&mut msg_out_len_buf) {
                            Ok(()) => (),
                            Err(_e) => break,
                        }

                        let mut msg_out_buf = vec![0u8; usize::from_be_bytes(msg_out_len_buf)];
                        match stream.read_exact(&mut msg_out_buf) {
                            Ok(()) => (),
                            Err(_e) => break,
                        }

                        // info!("db_call\t");
                        let msg_out = String::from_utf8(msg_out_buf).unwrap();
                        event_tx_db.send(String::from(&event)).unwrap();
                        event_tx_db.send(msg_out).unwrap();
                    }
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn send_db(
    instance: String,
    msg: String,
    state: tauri::State<'_, State>,
) -> Result<(), String> {

    let event = format!("db_{}_call", instance);
    let _ = state.db_tx.send(event).map_err(|e| e.to_string());
    state.db_tx.send(msg).map_err(|e| e.to_string())
}

#[tauri::command]
fn read_app(app: String, _: tauri::State<'_, State>) -> String {
    info!(app, "read_app\t");
    fs::read_to_string(format!("apps/{}.html", &app)).unwrap()
}

#[tauri::command]
fn read_file(path: String, _: tauri::State<'_, State>) -> String {
    info!(path, "read_file\t");
    let file: String = fs::read_to_string(format!("data/{}", &path)).unwrap();
    if file.len() == 0 {
        String::from("[]")
    } else {
        let data = file[..file.len() - 1].replace("\n", ",");
        format!("[{}]", &data)
    }
}

#[tauri::command]
fn is_file(filename: String, _: tauri::State<'_, State>) -> String {
    info!(filename, "is_file\t");
    if Path::new(&format!("data/{}", &filename)).exists() {
        String::from("1")
    } else {
        String::from("0")
    }
}

#[tauri::command]
fn get_cwd(_: tauri::State<'_, State>) -> String {
    let path_buf = std::env::current_dir().unwrap();
    format!("{:?}", &path_buf)
}