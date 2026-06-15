// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Rebuild triggered for updated Moni's Garden icon resource.
fn main() {
    tauri_app_lib::run()
}
