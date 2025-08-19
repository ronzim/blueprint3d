export class Callbacks {
  private funcs: Function[] = [];

  public add(func: Function) {
    this.funcs.push(func);
  }

  public remove(func: Function) {
    this.funcs = this.funcs.filter(f => f !== func);
  }

  public fire(...args: any[]) {
    this.funcs.forEach(f => f(...args));
  }
}
