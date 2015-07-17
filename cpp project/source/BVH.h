#ifndef BVH_H_
#define BVH_H_

class BVH
{
public:
	BVH(Geometry * geometry, int max_leaf_items_p_);
	Node * BuildTree(int from, int to, const int depth, char axis);
	void Traverse(Ray & ray);
private:
	void Traverse(Ray & ray, Node * node, float t0, float t1);
	Node * root_; // koren stromu
	Triangle * items_; // vsechny trojuhelniky nactene v geometry
	int leafs_, nodes_, max_depth_; // pocty itemu a leafu
	int max_leaf_items_;
};

#endif