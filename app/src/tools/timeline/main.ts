import '$shared/styles';
import '$shared/messages.en';
import './messages.en';
import { mount } from 'svelte';
import TimelineApp from './TimelineApp.svelte';

mount(TimelineApp, { target: document.getElementById('app')! });
