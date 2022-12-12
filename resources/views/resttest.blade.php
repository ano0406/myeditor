<!DOCTYPE html>
<html>
    <head>
        <title>resttest</title>
        <meta name="csrf-token" content="{{csrf_token()}}"/>
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
    </head>
    <body>
        <h1>ファイル作成:</h1>
        <label>ファイル名<textarea id="create_name" name="create_name"></textarea></label>
        <br/>
        <label>ファイル本文<textarea id="create_text" name="create_name"></textarea></label>
        <br/>
        <button type="button" id="create_button">作成</button>
        <h1>ファイル更新</h1>
        <label>ファイルid<textarea id="update_id"></textarea></label>
        <br/>
        <label>ファイル名<textarea id="update_name"></textarea></label>
        <br/>
        <label>ファイル本文<textarea id="update_text"></textarea></label>
        <br/>
        <button type="button" id="update_button">更新</button>
        <h1>ファイル削除</h1>
        <label>ファイルid<textarea id="delete_id"></textarea></label>
        <br/>
        <button type="button" id="delete_button">更新</button>
    </body>
    <script>
        jQuery(document).ready(
            function($){
                //ファイル作成ボタンを押した時のonclick
                $('#create_button').click(
                    function(){
                        const nameel = $('#create_name');
                        const name = nameel.val();
                        const textel = $('#create_text');
                        const text = textel.val();
                        const hosturl = '/rest';
                        $.ajax({
                            headers:{
                                'X-CSRF-TOKEN':$('meta[name="csrf-token"]').attr('content'),
                                'Content-Type':'application/json',
                            },
                            url:hosturl,
                            type:'post',
                            dataType:'plain/text',
                            data:JSON.stringify({
                                name:name,
                                text:text,
                            }),
                            timeout:3000,
                            success:function(res){
                                console.log(res);
                                alert('ファイル作成完了');
                            },
                            error:function(data){
                                console.log(data);
                                console.log(JSON.parse(data.responseText));
                            },
                        });
                    }
                );
                //ファイル更新ボタンを押した時のonclick
                $('#update_button').click(
                    function(){
                        const idel = $('#update_id');
                        const id = idel.val();
                        const nameel = $('#update_name');
                        const name = nameel.val();
                        const textel = $('#update_text');
                        const text = textel.val();
                        const hosturl = '/rest/' + id;
                        const json = {};
                        if(name !== ''){
                            json['name'] = name;
                        }
                        if(text !== ''){
                            json['text'] = text;
                        }
                        console.log(json);
                        $.ajax({
                            headers:{
                                'X-CSRF-TOKEN':$('meta[name="csrf-token"]').attr('content'),
                                'Content-Type':'application/json',
                            },
                            url:hosturl,
                            type:'put',
                            dataType:'plain/text',
                            data:JSON.stringify(json),
                            timeout:3000,
                            success:function(res){
                                console.log('ajax完了');
                                console.log(res);
                                json = JSON.parse(data.responseText);
                                if(json['success']){
                                    console.log('ファイル更新成功');
                                }else{
                                    console.log('ファイル更新失敗');
                                }
                            },
                            error:function(data){
                                console.log(data);
                                console.log(JSON.parse(data.responseText));
                            },
                        });
                    }
                );
                //ファイル削除ボタンを押した時のonclick
                $('#delete_button').click(
                    function(){
                        const idel = $('#delete_id');
                        const id = idel.val();
                        const hosturl = '/rest/' + id;
                        $.ajax({
                            headers:{
                                'X-CSRF-TOKEN':$('meta[name="csrf-token"]').attr('content'),
                                'Content-Type':'application/json',
                            },
                            url:hosturl,
                            type:'delete',
                            dataType:'plain/text',
                            data:JSON.stringify({
                            }),
                            timeout:3000,
                            success:function(res){
                                console.log('ajax完了');
                                console.log(res);
                                json = JSON.parse(data.responseText);
                                if(json['success']){
                                    console.log('ファイル削除成功');
                                }else{
                                    console.log('ファイル削除失敗');
                                }
                            },
                            error:function(data){
                                console.log(data);
                                console.log(JSON.parse(data.responseText));
                            },
                        });
                    }
                );
            }
        )
    </script>
</html>
