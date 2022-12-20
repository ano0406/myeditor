<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
//use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use App\Models\File;

use Illuminate\Support\Facades\Log;
use Response;


//TODO:jsonの送受信が上手くいっていない?クライアントからajaxでjsonを送ってもデータが届かないし、こちらからjsonをレスポンスとして送っても文字列として受け取られている
class FilesRestController extends Controller
{
    /**
     * 指定されたユーザーが作成した全ファイルの(ファイルid,ファイル名)の組をjsonで返す
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $user = Auth::user();
        $idname_pairs = File::select('id','name')->where('user_id',$user->id)->get();
        return response()->json($idname_pairs);
    }

    /**
     * ファイルの作成 ファイル本文(name)とテキスト(text)をリクエストに含める
     * 作成したファイルに割り当てられたidを返す(response:{id:number})
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        $result = $request->all();
        $name = $request->input('name');
        $text = $request->input('text');
        $file = new File;
        $file->user_id = $user->id;
        $file->name = $name;
        if($file->text != null){
            $file->text = $text;
        }else{
            $file->text = '';
        }
        $file->save();
        return response()->json([
            'id' => $file->id,
        ]);
    }

    /**
     * ファイルidに対し、ユーザーが保持していればファイル名(name:string)とファイル本文(text:string)を、jsonで返す
     * そうでなければ400を返す
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $user = Auth::user();
        $file = File::find($id);
        if($file != null and $file->user_id == $user->id){
            return response()->json([
                'name' => $file->name,
                'text' => $file->text,
            ]);
        }else{
            abort(400);
        }
    }

    /**
     * 指定idを持つファイルのファイル名、中身を更新する
     * $requestには新規ファイル名(name)またはファイルの中身(text)を含める
     * $requestにない項目は更新しない
     * 更新できない(ユーザーが保持するファイルではないなど)ならば400を返す
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $userid = Auth::user()->id;
        $file = File::find($id);
        if($file == null or $file->user_id != $userid){
            abort(400);
        }
        $name = $request->name;
        $text = $request->text;
        if($name != null){
            $file->name = $name;
        }
        if($text != null){
            $file->text = $text;
        }
        $file->save();
        return response()->json([]);
    }

    /**
     * 指定idを持つファイルを削除する
     * 削除失敗(ユーザーがファイルを所有していないなど)ならば400を返す
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $userid = Auth::user()->id;
        $file = File::find($id);
        if($file == null or $file->user_id != $userid){
            abort(400);
        }else{
            $file->delete();
            return response()->json([]);
        }
    }
}
