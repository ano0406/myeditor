<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\File;
use App\Models\Tag;
use App\Models\User;

use Illuminate\Support\Facades\Log;
use Response;


class FilesRestController extends Controller
{
    /**
     * 指定されたユーザーが作成した全ファイルの(ファイルid,ファイル名,タグ,作成日,最終更新日)の組をjsonで返す
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $userid = Auth::user()->id;
        $files = User::with('files.tags')->find($userid)->files()->get();
        $ret = [];
        foreach($files as $file)
        {
            $ret[] = $file->getFileDataArray([File::data_id,File::data_name,File::data_tags,File::data_created,File::data_updated]);
        }
        return response()->json($ret);
    }

    /**
     * ファイルの作成 ファイル本文(name)とテキスト(text)、タグの配列(tags:Array<string>)をリクエストに含める
     * 作成したファイルに割り当てられたidや作成日を返す(response:{id:number,created:datetime,updated:datetime})
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
        $file = $user->files()->create([
            'name' => $name,
            'text' => $text,
        ]);
        $newtags = $request->input('tags');
        $file->updateTags($newtags);
        return response()->json($file->getFileDataArray([File::data_id,File::data_created,File::data_updated]));
    }

    /**
     * ファイルidに対し、ユーザーが保持していればファイル名(name:string)とファイル本文(text:string)とタグ(tags:Array<string>)と作成日(created:datetime)と更新日(updated:datetime)を、jsonで返す
     * そうでなければ400を返す
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $user = Auth::user();
        $file = $user->files()->find($id);
        if($file != null){
            return response()->json($file->getFileDataArray([File::data_id,File::data_name,File::data_text,File::data_tags,File::data_created,File::data_updated]));
        }else{
            abort(400);
        }
    }

    /**
     * 指定idを持つファイルのファイル名、中身、タグを更新する
     * $requestには新規ファイル名(name)またはファイルの中身(text)またはタグの配列(tags)を含める
     * $requestにない項目は更新しない
     * 更新できない(ユーザーが保持するファイルではないなど)ならば400を返す
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $file = Auth::user()->files()->find($id);
        if($file == null){
            abort(400);
        }
        $name = $request->name;
        $text = $request->text;
        $tags = $request->tags;
        if($name != null){
            $file->name = $name;
        }
        if($text != null){
            $file->text = $text;
        }
        $file->save();
        if($tags != null){
            $file->updateTags($tags);
        }
        return response()->json(File::getFileDataArray([File::data_updated]));
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
        $file = Auth::user()->files()->find($id);
        if($file == null){
            abort(400);
        }else{
            $file->tags()->detach();
            $file->delete();
            return response()->json([]);
        }
    }
}
