<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\FilesRestController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

//編集画面
//TODO:Inertia::render('edit')すると、app/guestレイアウトに差し込まれた状態に勝手になるが、どこで設定されている?
//TODO:何かしらのルートを'dashboard'に設定しないと、'/profile'が開けなくなる?
Route::get('/', function () {
    return view('edit');
})->middleware(['auth','verified'])->name('dashboard');

/*Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');*/

//アカウント設定画面
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

//ログイン・認証していない状態でアクセスすると、ログインページにリダイレクトさせられる
Route::resource('/rest',FilesRestController::class)->middleware(['auth','verified']);


//restのテスト用の、仮ページ
Route::get('/resttest',function(){
    return view('resttest');
})->middleware(['auth','verified']);

//TODO:ログイン画面からログインすると、編集画面(/)が何故かiframeに収まった状態で描画される
//ログイン画面を後で書き直す
require __DIR__.'/auth.php';
