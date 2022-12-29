<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

use App\Models\Tag;
use Illuminate\Support\Facades\Log;

class UnusedTagsDelete extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'command:UnusedTagsDelete';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete unused tags.';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $unused = Tag::with('files')->doesntHave('files')->get();
        $unused->each(function($tag){
            $tag->delete();
        });
        return Command::SUCCESS;
    }
}
