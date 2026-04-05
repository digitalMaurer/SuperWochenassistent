/**
 * Capa de persistencia compartida para toda la app.
 *
 * Claves de localStorage:
 * - tasks
 * - pom_stats
 * - schedule
 */
(function storageLayer(){
	'use strict';

	const KEY_TASKS = 'tasks';
	const KEY_POM_STATS = 'pom_stats';
	const KEY_SCHEDULE = 'schedule';

	function safeParse(raw, fallback){
		if(!raw) return fallback;
		try{ return JSON.parse(raw); }
		catch(_err){ return fallback; }
	}

	function loadByKey(key, fallback){
		return safeParse(localStorage.getItem(key), fallback);
	}

	function saveByKey(key, value){
		localStorage.setItem(key, JSON.stringify(value));
	}

	function loadTasks(){
		return loadByKey(KEY_TASKS, []);
	}

	function saveTasks(tasks){
		saveByKey(KEY_TASKS, Array.isArray(tasks) ? tasks : []);
	}

	function loadPomStats(){
		return loadByKey(KEY_POM_STATS, {});
	}

	function savePomStats(pomStats){
		saveByKey(KEY_POM_STATS, pomStats && typeof pomStats === 'object' ? pomStats : {});
	}

	function loadSchedule(){
		const raw = loadByKey(KEY_SCHEDULE, null);
		if(!raw || typeof raw !== 'object'){
			return { version: 1, slots: {}, customTasks: [] };
		}
		return {
			version: typeof raw.version === 'number' ? raw.version : 1,
			slots: raw.slots && typeof raw.slots === 'object' ? raw.slots : {},
			customTasks: Array.isArray(raw.customTasks) ? raw.customTasks : []
		};
	}

	function saveSchedule(schedule){
		const normalized = schedule && typeof schedule === 'object' ? schedule : { slots: {}, customTasks: [] };
		normalized.version = 2;
		if(!normalized.slots || typeof normalized.slots !== 'object') normalized.slots = {};
		if(!Array.isArray(normalized.customTasks)) normalized.customTasks = [];
		saveByKey(KEY_SCHEDULE, normalized);
	}

	window.loadTasks = loadTasks;
	window.saveTasks = saveTasks;
	window.loadPomStats = loadPomStats;
	window.savePomStats = savePomStats;
	window.loadSchedule = loadSchedule;
	window.saveSchedule = saveSchedule;
})();
