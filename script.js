const portraitImage = document.querySelector(".portrait-image");
const portraitFrame = document.querySelector(".portrait-frame");

if (portraitImage && portraitFrame) {
	portraitImage.addEventListener("load", () => portraitFrame.classList.add("has-image"));
	portraitImage.addEventListener("error", () => portraitFrame.classList.remove("has-image"));
}

const missionItems = Array.from(document.querySelectorAll("[data-mission]"));
const routeStops = Array.from(document.querySelectorAll("[data-route]"));
const storageKey = "umid-portfolio-missions";
const quizStorageKey = "umid-portfolio-quiz";
const validMissionIds = new Set(["math", "python", "ai"]);
const quizQuestions = [
	{
		id: "pandas",
		prompt: "Which Python library is commonly used to work with tabular data?",
	options: ["Pandas", "Django", "Pygame"],
		answer: "Pandas",
	},
	{
		id: "xor",
		prompt: "When does an XOR gate output 1?",
		options: ["When the inputs differ", "When both inputs are 1", "When both inputs are 0"],
		answer: "When the inputs differ",
	},
	{
		id: "supervised-learning",
		prompt: "What kind of examples does supervised learning use?",
		options: ["Labeled examples", "Unlabeled groups only", "Random computer instructions"],
		answer: "Labeled examples",
	},
];
const completedMissions = new Set();
const correctQuizAnswers = new Set();

try {
	const savedMissions = JSON.parse(localStorage.getItem(storageKey) || "[]");
	if (Array.isArray(savedMissions)) {
		savedMissions.forEach((missionId) => {
			if (validMissionIds.has(missionId)) completedMissions.add(missionId);
		});
	}
} catch {
	// Storage can be unavailable for local files or restricted browser sessions.
}

try {
	const savedQuizAnswers = JSON.parse(localStorage.getItem(quizStorageKey) || "[]");
	if (Array.isArray(savedQuizAnswers)) {
		savedQuizAnswers.forEach((questionId) => {
			if (quizQuestions.some((question) => question.id === questionId)) correctQuizAnswers.add(questionId);
		});
	}
} catch {
	// Keep the challenge playable when browser storage is unavailable.
}

function renderAchievements() {
	const achievementStatus = {
		"first-lap": completedMissions.size > 0,
		"season-finish": completedMissions.size === validMissionIds.size,
		"quiz-ace": correctQuizAnswers.size === quizQuestions.length,
	};

	document.querySelectorAll("[data-achievement]").forEach((achievement) => {
		const isUnlocked = achievementStatus[achievement.dataset.achievement] || false;
		const status = achievement.querySelector(".achievement-state");
		achievement.classList.toggle("is-unlocked", isUnlocked);
		if (status) status.textContent = isUnlocked ? "UNLOCKED" : "LOCKED";
	});
}

function renderMissionProgress() {
	const completedCount = completedMissions.size;
	const totalXp = completedCount * 100 + correctQuizAnswers.size * 25;
	const currentLevel = Math.floor(totalXp / 300) + 1;
	const levelXp = totalXp % 300;
	const levelNumber = document.querySelector(".level-number");
	const xpTotal = document.querySelector(".xp-total");
	const levelProgress = document.querySelector(".level-progress");
	const missionCounter = document.querySelector(".mission-counter");
	const progressBar = document.querySelector(".xp-track");
	const xpFill = document.querySelector(".xp-fill");
	const playerRank = document.querySelector(".player-rank");
	const quizScore = document.querySelector(".quiz-score");
	const routeCounter = document.querySelector(".route-counter");
	const routeProgress = document.querySelector(".route-progress");
	const rankNames = ["ROOKIE", "TRAINEE", "SPECIALIST", "ACE"];

	if (levelNumber) levelNumber.textContent = String(currentLevel).padStart(2, "0");
	if (xpTotal) xpTotal.textContent = String(totalXp);
	if (playerRank) playerRank.textContent = rankNames[Math.min(currentLevel - 1, rankNames.length - 1)];
	if (quizScore) quizScore.textContent = `${correctQuizAnswers.size}/${quizQuestions.length}`;
	if (levelProgress) levelProgress.textContent = `${levelXp} / 300 XP TO LEVEL ${String(currentLevel + 1).padStart(2, "0")}`;
	if (missionCounter) missionCounter.textContent = `${completedCount} / ${missionItems.length} COMPLETE`;
	if (routeCounter) routeCounter.textContent = `${completedCount} OF ${missionItems.length} CLEARED`;
	if (routeProgress) routeProgress.style.width = `${(completedCount / Math.max(missionItems.length, 1)) * 100}%`;
	if (progressBar) progressBar.setAttribute("aria-valuenow", String(levelXp));
	if (xpFill) xpFill.style.width = `${(levelXp / 300) * 100}%`;

	missionItems.forEach((item) => {
		const missionId = item.dataset.mission;
		const isComplete = completedMissions.has(missionId);
		const button = item.querySelector(".mission-button");
		const label = item.querySelector(".mission-action-label");
		if (button) button.setAttribute("aria-pressed", String(isComplete));
		if (label) label.textContent = isComplete ? "Checkpoint logged" : "Log checkpoint";
		item.classList.toggle("is-complete", isComplete);
	});
	routeStops.forEach((stop) => stop.classList.toggle("is-complete", completedMissions.has(stop.dataset.route)));
	renderAchievements();

	try {
		localStorage.setItem(storageKey, JSON.stringify(Array.from(completedMissions)));
	} catch {
		// The current page remains usable when persistence is unavailable.
	}
}

missionItems.forEach((item) => {
	const button = item.querySelector(".mission-button");
	if (!button) return;
	button.addEventListener("click", () => {
		const missionId = item.dataset.mission;
		if (completedMissions.has(missionId)) completedMissions.delete(missionId);
		else completedMissions.add(missionId);
		renderMissionProgress();
	});
});

renderMissionProgress();

const quizPanel = document.querySelector("[data-quiz]");

if (quizPanel) {
	const quizStage = quizPanel.querySelector(".quiz-stage");
	const quizQuestion = quizPanel.querySelector(".quiz-question");
	const quizOptions = Array.from(quizPanel.querySelectorAll("[data-quiz-choice]"));
	const quizFeedback = quizPanel.querySelector(".quiz-feedback");
	const quizSubmit = quizPanel.querySelector(".quiz-submit");
	const quizReward = quizPanel.querySelector(".quiz-reward");
	let currentQuestionIndex = quizQuestions.findIndex((question) => !correctQuizAnswers.has(question.id));
	let selectedAnswer = null;
	let questionSolved = false;

	function renderQuizQuestion() {
		const question = quizQuestions[currentQuestionIndex];
		if (!question) {
			quizStage.textContent = "EVENT COMPLETE";
			quizQuestion.textContent = "Perfect pit stop.";
			quizOptions.forEach((option) => { option.hidden = true; });
			quizFeedback.textContent = "All three answers correct. The Pit-stop ace badge is unlocked.";
			quizReward.textContent = "CLEARED";
			quizSubmit.hidden = true;
			return;
		}

		quizStage.textContent = `QUESTION ${String(currentQuestionIndex + 1).padStart(2, "0")} / ${String(quizQuestions.length).padStart(2, "0")}`;
		quizQuestion.textContent = question.prompt;
		quizFeedback.textContent = "Select your answer.";
		quizReward.textContent = correctQuizAnswers.has(question.id) ? "CLEARED" : "+25 XP";
		quizSubmit.disabled = true;
		quizSubmit.hidden = false;
		quizSubmit.textContent = "Lock answer";
		quizOptions.forEach((option, optionIndex) => {
			option.hidden = false;
			option.disabled = false;
			option.textContent = question.options[optionIndex];
			option.dataset.quizChoice = question.options[optionIndex];
			option.setAttribute("aria-pressed", "false");
		});
	}

	quizOptions.forEach((option) => {
		option.addEventListener("click", () => {
			if (questionSolved) return;
			selectedAnswer = option.dataset.quizChoice;
			quizOptions.forEach((choice) => choice.setAttribute("aria-pressed", String(choice === option)));
			quizSubmit.disabled = false;
		});
	});

	quizSubmit.addEventListener("click", () => {
		if (questionSolved) {
			currentQuestionIndex = quizQuestions.findIndex((question) => !correctQuizAnswers.has(question.id));
			selectedAnswer = null;
			questionSolved = false;
			renderQuizQuestion();
			return;
		}

		if (!selectedAnswer) return;
		const question = quizQuestions[currentQuestionIndex];
		if (selectedAnswer !== question.answer) {
			quizFeedback.textContent = "Not quite. Try another answer.";
			quizPanel.classList.add("has-error");
			return;
		}

		correctQuizAnswers.add(question.id);
		try {
			localStorage.setItem(quizStorageKey, JSON.stringify(Array.from(correctQuizAnswers)));
		} catch {
			// The current challenge remains playable without persistence.
		}
		questionSolved = true;
		quizPanel.classList.remove("has-error");
		quizPanel.classList.add("has-correct-answer");
		quizFeedback.textContent = "Correct. +25 XP added to your career total.";
		quizSubmit.textContent = currentQuestionIndex === quizQuestions.length - 1 ? "Finish challenge" : "Next question";
		quizOptions.forEach((option) => { option.disabled = true; });
		renderMissionProgress();
	});

	if (currentQuestionIndex < 0) currentQuestionIndex = quizQuestions.length;
	renderQuizQuestion();
}

const neuralCanvas = document.querySelector("#neural-canvas");
const canvasContext = neuralCanvas?.getContext("2d");

if (neuralCanvas && canvasContext) {
	const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
	const pointerPosition = { x: -1000, y: -1000, active: false };
	let canvasWidth = window.innerWidth;
	let canvasHeight = window.innerHeight;
	let networkNodes = [];

	function resizeNetwork() {
		const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
		canvasWidth = window.innerWidth;
		canvasHeight = window.innerHeight;
		neuralCanvas.width = Math.floor(canvasWidth * pixelRatio);
		neuralCanvas.height = Math.floor(canvasHeight * pixelRatio);
		canvasContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

		const nodeCount = Math.max(34, Math.min(88, Math.floor((canvasWidth * canvasHeight) / 18000)));
		networkNodes = Array.from({ length: nodeCount }, () => ({
			x: Math.random() * canvasWidth,
			y: Math.random() * canvasHeight,
			velocityX: (Math.random() - 0.5) * 0.24,
			velocityY: (Math.random() - 0.5) * 0.24,
			accent: Math.random() > 0.82,
		}));
		drawNetwork();
	}

	function drawNetwork() {
		canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);

		networkNodes.forEach((node, nodeIndex) => {
			if (!reducedMotion.matches) {
				node.x += node.velocityX;
				node.y += node.velocityY;
				if (node.x < 0 || node.x > canvasWidth) node.velocityX *= -1;
				if (node.y < 0 || node.y > canvasHeight) node.velocityY *= -1;
			}

			for (let otherIndex = nodeIndex + 1; otherIndex < networkNodes.length; otherIndex += 1) {
				const otherNode = networkNodes[otherIndex];
				const horizontalDistance = node.x - otherNode.x;
				const verticalDistance = node.y - otherNode.y;
				const distance = Math.hypot(horizontalDistance, verticalDistance);
				if (distance < 135) {
					const opacity = (1 - distance / 135) * 0.3;
					canvasContext.strokeStyle = `rgba(127, 151, 181, ${opacity})`;
					canvasContext.lineWidth = 0.7;
					canvasContext.beginPath();
					canvasContext.moveTo(node.x, node.y);
					canvasContext.lineTo(otherNode.x, otherNode.y);
					canvasContext.stroke();
				}
			}

			if (pointerPosition.active) {
				const pointerDistance = Math.hypot(node.x - pointerPosition.x, node.y - pointerPosition.y);
				if (pointerDistance < 185) {
					const opacity = (1 - pointerDistance / 185) * 0.72;
					canvasContext.strokeStyle = `rgba(239, 57, 69, ${opacity})`;
					canvasContext.lineWidth = 1;
					canvasContext.beginPath();
					canvasContext.moveTo(node.x, node.y);
					canvasContext.lineTo(pointerPosition.x, pointerPosition.y);
					canvasContext.stroke();
				}
			}

			canvasContext.fillStyle = node.accent ? "rgba(245, 200, 66, .7)" : "rgba(166, 188, 216, .5)";
			canvasContext.beginPath();
			canvasContext.arc(node.x, node.y, node.accent ? 1.8 : 1.2, 0, Math.PI * 2);
			canvasContext.fill();
		});

		if (pointerPosition.active) {
			canvasContext.fillStyle = "rgba(245, 200, 66, .95)";
			canvasContext.beginPath();
			canvasContext.arc(pointerPosition.x, pointerPosition.y, 2.5, 0, Math.PI * 2);
			canvasContext.fill();
		}

		if (!reducedMotion.matches) window.requestAnimationFrame(drawNetwork);
	}

	window.addEventListener("pointermove", (event) => {
		pointerPosition.x = event.clientX;
		pointerPosition.y = event.clientY;
		pointerPosition.active = true;
		if (reducedMotion.matches) drawNetwork();
	}, { passive: true });
	window.addEventListener("pointerleave", () => { pointerPosition.active = false; });
	window.addEventListener("resize", resizeNetwork, { passive: true });
	reducedMotion.addEventListener("change", drawNetwork);
	resizeNetwork();
}

