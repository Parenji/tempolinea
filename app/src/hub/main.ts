import '$shared/styles';
import '$shared/messages.en';
import { mount } from 'svelte';
import Hub from './Hub.svelte';

mount(Hub, { target: document.getElementById('app')! });
