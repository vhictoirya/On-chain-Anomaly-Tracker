#!/bin/bash
curl -L https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-Linux-x86_64.sh -o miniforge.sh
bash miniforge.sh -b -p $HOME/conda
export PATH=$HOME/conda/bin:$PATH
conda create -n vercel_env python=3.11 -y
source $HOME/conda/bin/activate vercel_env
pip install -r requirements.txt