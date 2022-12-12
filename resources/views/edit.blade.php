<!DOCTYPE html>
<html>
    <head>
        <title>編集</title>
    </head>
    <body>
        <h1>ここに編集画面</h1>
        <form method="POST" action="{{ route('logout') }}">
            @csrf
            <button type="submit">ログアウト</button>
        </form>
        <a href="{{route('profile.edit')}}">プロフィール編集</a>
</body>
</html>
