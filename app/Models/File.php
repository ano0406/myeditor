<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Support\Facades\Log;


class File extends Model
{
    use HasFactory;
    protected $guarded = ['id','created_at','updated_at'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class);
    }

    //与えられたタグの配列(Array<string>)でタグを更新する
    //テーブルtagsに未登録のタグは新規登録する
    public function updateTags($newtags)
    {
        $newtags_ups = [];
        foreach($newtags as $tag){
            $newtags_ups[] = ['name' => $tag];
        }
        Tag::upsert($newtags_ups,['name'],['name']);
        //更新前持っているタグ
        $curtags = $this->tags;
        //更新後持つべきタグ
        $newtags = Tag::whereIn('name',$newtags)->get();
        //更新前持っていて、更新後持たないべきタグを消す
        $deltags = $curtags->diff($newtags);
        $this->tags()->detach($deltags);
        //更新前持っておらず、更新後持っているべきタグを追加する
        $addtags = $newtags->diff($curtags);
        $this->tags()->attach($addtags);
    }

    //このファイルのタグの配列を、文字列の配列として返す
    public function tagNamesArray()
    {
        $tags = $this->tags;
        $ret = [];
        foreach($tags as $tag){
            $ret[] = $tag->name;
        }
        return $ret;
    }
}
