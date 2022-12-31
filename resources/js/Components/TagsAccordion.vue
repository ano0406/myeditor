<script setup lang="ts">
import TagCheckBoxVue from './tagCheckBox.vue';

defineProps<{alltags:Set<string>}>();
const emit = defineEmits<{
    (event:'checked',name:string):void;
    (event:'unchecked',name:string):void;
}>();
</script>

<template>
    <div class="accordion" id="accordion_tag">
        <div class="accordion-item">
            <h2 class="accordion-header" id="headingOne">
                <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_tag" aria-expanded="true" aria-controls="collapseOne" style="background-color: rgb(180, 180, 180)">
                    タグを選択
                </button>
            </h2>
            <div id="collapse_tag" class="accordion-collapse collapse show" aria-labelledby="headingOne" data-bs-parent="#accordion_tag">
                <div class="accordion-body" style="background-color: rgb(180, 180, 180)">
                    <TagCheckBoxVue v-for="name of alltags" :name="name" @checked="emit('checked',name)" @unchecked="emit('unchecked',name)"/>
                </div>
            </div>
        </div>
    </div>
</template>
