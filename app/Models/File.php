<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use DateTimeInterface;

use Illuminate\Support\Facades\Log;


class File extends Model
{
    use HasFactory;
    protected $guarded = ['id','created_at','updated_at'];
    const datetime_format = 'Y-m-d h:i:s';
    const data_id = 'id';
    const data_name = 'name';
    const data_text = 'text';
    const data_tags = 'tags';
    const data_created = 'created';
    const data_updated = 'updated';

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

    public function getFileDataArray(array $arr):array
    {
        $ret = [];
        if(in_array(self::data_id,$arr)){
            $ret[self::data_id] = $this->id;
        }
        if(in_array(self::data_name,$arr)){
            $ret[self::data_name] = $this->name;
        }
        if(in_array(self::data_text,$arr)){
            $ret[self::data_text] = $this->text;
        }
        if(in_array(self::data_tags,$arr)){
            $ret[self::data_tags] = $this->tagNamesArray();
        }
        if(in_array(self::data_created,$arr)){
            $ret[self::data_created] = $this->getFormartedCreated();
        }
        if(in_array(self::data_updated,$arr)){
            $ret[self::data_updated] = $this->getFormartedUpdated();
        }
        return $ret;
    }

    //このファイルのタグの配列を、文字列の配列として返す
    private function tagNamesArray()
    {
        $tags = $this->tags;
        $ret = [];
        foreach($tags as $tag){
            $ret[] = $tag->name;
        }
        return $ret;
    }

    private function getFormartedCreated()
    {
        return $this->created_at->format(self::datetime_format);
    }

    private function getFormartedUpdated()
    {
        return $this->updated_at->format(self::datetime_format);
    }

    protected function serializeDate(DateTimeInterface $date){
        return $date->format('Y-m-d h:i:s');
    }
}
