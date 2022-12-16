<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
     *
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
    }

    /**
     * ファイルの作成 ファイル本文(name)とテキスト(text)をリクエストに含める
     * レスポンスとして、割り当てられた新規ファイルidと成功か否かをjson({success:boolean,id:number})として返す
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
        $success = true;
        //同名のファイルがないかチェック
        if(File::where('name',$name)->exists()){
            $success = false;
        }
        if($success){
            $file = new File;
            $file->user_id = $user->id;
            $file->name = $name;
            $file->text = $text;
            $file->save();
            return response()->json([
                'success' => true,
                'id' => $file->id,
            ]);
        }else{
            return response()->json([
                'success' => false,
            ]);
        }
    }

    /**
     * ファイルidに対し、
     * ・取得成功か否か(success:boolean)
     * ・成功ならば指定idのファイル名(name:string)とファイル本文(text:string)
     * を、jsonで返す
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    //TODO:取得できなかったら別のエラーコードで返した方が、処理が楽
    public function show($id)
    {
        $user = Auth::user();
        $file = File::find($id);
        if($file != null and $file->user_id == $user->id){
            return response()->json([
                'success' => true,
                'name' => $file->name,
                'text' => $file->text,
            ]);
        }else{
            return response()->json([
                'success' => false,
            ]);
        }
    }

    /**
     * 指定idを持つファイルのファイル名、中身を更新する
     * $requestには新規ファイル名(name)またはファイルの中身(text)を含める
     * $requestにない項目は更新しない
     * レスポンスとして、更新成功か否か(success:boolean)を持つjsonを返す
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
            return response()->json([
                'success' => false,
            ]);
        }
        $name = $request->name;
        $text = $request->text;
        if($name != null){
            //同じユーザーの同名ファイルがあれば更新しない
            $samename_file = File::select('id')->where('user_id',$userid)->where('name',$name)->first();
            if($samename_file != null and $samename_file->id != $id){
                return response()->json([
                    'success' => false,
                ]);
            }
            $file->name = $name;
        }
        if($text != null){
            $file->text = $text;
        }
        $file->save();
        return response()->json([
            'success' => true,
        ]);
    }

    /**
     * 指定idを持つファイルを削除する
     * レスポンスとして、削除成功か否か(success:boolean)を持つjsonを返す
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $userid = Auth::user()->id;
        $file = File::find($id);
        if($file == null or $file->user_id != $userid){
            return response()->json([
                'success' => false,
            ]);
        }else{
            $file->delete();
            return response()->json([
                'success' => true,
            ]);
        }
    }
}
