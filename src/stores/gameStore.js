const api = window.api;

export async function getGames() {
  return api.getGames();
}

export async function addGame({ name, exePath, coverPath }) {
  return api.addGame({ name, exePath, coverPath });
}

export async function removeGame(id) {
  return api.removeGame(id);
}

export async function launchGame(exePath) {
  return api.launchGame(exePath);
}

export async function pickExe() {
  return api.pickExe();
}

export async function powerAction(action) {
  return api.powerAction(action);
}
