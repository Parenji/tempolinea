import '$shared/styles';
import { mount } from 'svelte';
import TimelineApp from './TimelineApp.svelte';

mount(TimelineApp, { target: document.getElementById('app')! });
