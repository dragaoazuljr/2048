import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridComponent } from './grid.component';
import { BlockModule } from '../block/block.module';



@NgModule({
  declarations: [
    GridComponent
  ],
  imports: [
    CommonModule,
    BlockModule
  ],
  exports: [
    GridComponent
  ]
})
export class GridModule { }
